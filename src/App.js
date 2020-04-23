import React, {useState} from 'react';
import Loader from './components/Loader'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'
import SimpleMDE from "react-simplemde-editor"
import { v4 as uuidv4 } from 'uuid'
import {flattenArr, objToArr, timestampToString} from './utils/helper'
import fileHelper from './utils/fileHelper'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import "easymde/dist/easymde.min.css"
import useIpcRenderer from './hooks/useIpcRenderer'
const Store = window.require('electron-store')
const fileStore = new Store({name: 'Files Data'})
const settingsStore = new Store({name: 'Settings'})
const { join, basename, extname, dirname } = window.require('path')
const { remote } = window.require('electron')
function App() {
  const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')
  const [ isLoading, setLoading ] = useState(true)
  const [ searchedFiles, setSearchedFiles ] = useState([])
  const [ activeFileID, setActiveFileID ] =useState('')
  const [ openedFileIDs, setOpenedFileIDs ] = useState([])
  const [ unsavedFileIDs, setUnsavedFileIDs ] = useState([])
  const [ files, setFiles ] = useState(fileStore.get('files') || {})
  const activeFile = files[activeFileID]
  const filesArr = objToArr(files)
  const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  const fileSearch = function (keyword) {
    if (keyword !== false) {
      keyword = keyword.toLocaleLowerCase()
      const newFiles = filesArr.filter(file => {
        const title = file.title.toLocaleLowerCase()
        return title.includes(keyword)
      })
      setSearchedFiles(newFiles)
    } else {
      setSearchedFiles([])
    }
  }
  const saveFilesToStore = (files) => {
    const filesStoreObj = objToArr(files).reduce((result, file) => {
      const { id, path, title, createdAt, isSynced, updatedAt } = file
      result[id] = {
        id,
        path,
        title,
        createdAt,
        isSynced,
        updatedAt
      }
      return result
    }, {})
    fileStore.set('files', filesStoreObj)
  }
  const createNewFile = function () {
    const newID = uuidv4()
    const newFile = {
      id: newID,
      title: '',
      body: '## 请输出 Markdown',
      createdAt: new Date().getTime(),
      isNew: true,
    }
    setFiles({ ...files, [newID]: newFile })
  }
  const updateFileName = function (id, title, isNew) {
    const newPath = isNew ? join(savedLocation, `${title}.md`) : join(dirname(files[id].path), `${title}.md`)
    const modifiedFile = { ...files[id], title, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = files[id].path
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }
  const importFiles = function () {
    remote.dialog.showOpenDialog({
      title: '选择导入的 Markdown 文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {name: 'Markdown files', extensions: ['md']}
      ]
    }).then(result => {
      const allfilePaths = result.filePaths
      let filePaths = allfilePaths.filter(path => {
        const alreadyAdded = Object.values(files).find(file => {
          return file.path === path
        })
        return !alreadyAdded
      })
      const importFilesArr = filePaths.map(path => {
        return {
          id: uuidv4(),
          title: basename(path, extname(path)),
          path,
        }
      })
      const newFiles = { ...files, ...flattenArr(importFilesArr)}
      setFiles(newFiles)
      saveFilesToStore(newFiles)
      if (importFilesArr.length > 0) {
        remote.dialog.showMessageBox({
          type: 'info',
          title: `成功导入了${importFilesArr.length}个文件`,
          message: `成功导入了${importFilesArr.length}个文件`,
        })
      }
    }).catch(err => {
      console.log(err)
    })
  }
  const deleteFile = function (id) {
    if (files[id].isNew) {
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        tabClose(id)
      })
    }
  }
  const fileClick = function (fileID) {
    setActiveFileID(fileID)
    const currentFile = files[fileID]
    const { id, title, path, isLoaded } = currentFile
    if (!isLoaded) {
      fileHelper.readFile(currentFile.path).then(value => {
        const newFile = { ...files[fileID], body: value, isLoaded: true }
        setFiles({ ...files, [fileID]: newFile })
      })
    }
    if (!openedFileIDs.includes(id)) {
      setOpenedFileIDs([ ...openedFileIDs, fileID ])
    }
  }
  const tabClick = function (fileID) {
    setActiveFileID(fileID)
  }
  const tabClose = function (id) {
    if (unsavedFileIDs.includes(id)) {
      remote.dialog.showMessageBox({
        type: 'warning',
        buttons: ['取消', '确认关闭'],
        message: '该文件未保存，是否确认关闭？'
      }).then(res => {
        if (res.response === 1) {
          handleClose(id)
        }
      })
    } else {
      handleClose(id)
    }
  }
  const handleClose = function (id) {
    const newOpenedFileIDs = openedFileIDs.filter(fileId => fileId !== id)
    setOpenedFileIDs(newOpenedFileIDs)
    if (setOpenedFileIDs.length > 0) {
      setActiveFileID(newOpenedFileIDs[0])
    } else {
      setActiveFileID('')
    }
  }
  const fileChange = function (id, value) {
    if (value !== files[id].body) {
      const newFile = { ...files[id], body: value }
      setFiles({ ...files, [id]: newFile })
      if (!unsavedFileIDs.includes(id)) {
        setUnsavedFileIDs([ ...unsavedFileIDs, id])
      }
    }
  }
  const saveCurrentFile = function () {
    const { path, body, title } = activeFile
    fileHelper.writeFile(path, body).then(res => {
      const newUnsavedFileIDs = unsavedFileIDs.filter(fileId => fileId !== activeFile.id)
      setUnsavedFileIDs(newUnsavedFileIDs)
    })
  }
  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile
  })
  setTimeout(() => {
    setLoading(false)
  }, 1000)
  return (
    <div className="App container-fluid px-0">
      {isLoading && <Loader />}
      <div className="row no-gutters">
        <div className="col-3 bg-light left-panel">
          <FileSearch title="搜索" onFileSearch={fileSearch} />
          <FileList
            onFileDelete={deleteFile}
            onSaveEdit={updateFileName}
            onFileClick={fileClick}
            files={fileListArr}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomBtn 
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
                onBtnClick={createNewFile}
              />
            </div>
            <div className="col">
              <BottomBtn 
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
                onBtnClick={importFiles}
              />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          { !activeFile && 
            <div className="start-page">
              选择或者创建新的 Markdown 文档
            </div>
          }
          { activeFile &&
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileID}
                unsaveIds={unsavedFileIDs}
                onTabClick={tabClick}
                onCloseTab={tabClose}
              />
              <SimpleMDE
                key={activeFile && activeFile.id} 
                value={activeFile && activeFile.body}
                onChange={(value) => {fileChange(activeFile.id, value)}}
                options={{
                  minHeight: '515px',
                }}
              />
              { activeFile.isSynced && 
                <span className="sync-status">已同步，上次同步{timestampToString(activeFile.updatedAt)}</span>
              }
            </>
          }
        </div>
      </div>
    </div>
  )
}

export default App;
