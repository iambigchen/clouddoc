const { app, Menu, ipcMain, dialog } = require('electron')
const AppWindow = require('./src/AppWindow')
const path = require('path')
const menuTemplate = require('./src/menuTemplate')
// const isDev = require('electron-is-dev')

function createWindow () {
  const mainWindowConfig = {
    width: 1440,
    height: 768,   
  }
  const urlLocation = `file://${path.join(__dirname, './index.html')}`
  mainWindow = new AppWindow(mainWindowConfig, urlLocation)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.webContents.openDevTools()
  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  ipcMain.on('open-settings-window', () => {
    const settingsWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow  
    }
    const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
    settingsWindow.removeMenu()
    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
  })

  ipcMain.on('config-is-saved', () => {
    
  })
}
app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (AppWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.allowRendererProcessReuse = true