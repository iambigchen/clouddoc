import React, {useState, useRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import useKeyPress from '../hooks/useKeyPress'
import useIpcRenderer from '../hooks/useIpcRenderer'

const FileSearch = ({ title, onFileSearch }) => {
  const [ inputActive, setInputActive ] = useState(false)
  const [value, setValue] = useState('')
  const node = useRef(null)
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)
  const closeSearch = function () {
    setInputActive(false)
    setValue('')
    onFileSearch(false)
  }
  const startSearch = () => {
    setInputActive(true)
  }

  useEffect(() => {
    if (enterPressed && inputActive) {
      onFileSearch(value)
    }
    if(escPressed && inputActive) {
      closeSearch()
    }
  }, [enterPressed, escPressed])

  useEffect(() => {
    if (inputActive) {
      node.current.focus()
    }
  }, [inputActive])
  
  useIpcRenderer({
    'search-file': startSearch
  })
  return (
    <div className="alert alert-primary d-flex justify-content-between align-items-center mb-0">
      {!inputActive && 
        <>
        <span>{title}</span>
          <button
            type="button"
            className="icon-button"
            onClick={startSearch}
          >
            <FontAwesomeIcon
              title="搜索"
              size="lg"
              icon={faSearch} 
            />
          </button>
        </>
      }
      {
        inputActive && 
        <>
          <input 
            className="form-control"
            value={value}
            ref={node}
            onChange={(e) => { setValue(e.target.value) }}
          />
          <button
            type="button"
            className="icon-button"
            onClick={closeSearch}
          >
            <FontAwesomeIcon
              title="关闭"
              size="lg"
              icon={faTimes} 
            />
          </button>
        </>
      }
    </div>
  )
}

FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func.isRequired
}
FileSearch.defaultProps = {
  title: '我的云文档'
}
export default FileSearch