const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  session,
} = require("electron");
const path = require("path");
const Store = require("electron-store");
const isDev = require("electron-is-dev");
const Sentry = require("@sentry/electron");

app.commandLine.appendSwitch("enable-features", "ElectronSerialChooser");
app.commandLine.appendSwitch("disable-site-isolation-trials");

Sentry.init({
  dsn: "https://6277c648063a5c877dc9d50050649ec0@o4509435684126720.ingest.de.sentry.io/4509435722203216",
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});

const store = new Store();

let mainWindow;
let isQuitting = false;
let tray = null;

const contextMenu = Menu.buildFromTemplate([
  {
    label: "Afficher l'application",
    click: () => {
      if (mainWindow) mainWindow.show();
    },
  },
  {
    label: "Démarrer avec Mac",
    type: "checkbox",
    checked: store.get("startWithMac", false),
    click: (menuItem) => {
      store.set("startWithMac", menuItem.checked);
      app.setLoginItemSettings({
        openAtLogin: menuItem.checked,
      });
    },
  },
  { type: "separator" },
  {
    label: "Quitter",
    click: () => {
      isQuitting = true;
      app.quit();
    },
  },
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      enableRemoteModule: false,
      allowRunningInsecureContent: true,
    },
  });

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.resolve(__dirname, "..", "dist", "index.html")}`;

  console.log("Loading URL:", startUrl);

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Failed to load:", errorCode, errorDescription);
      if (isDev) {
        setTimeout(() => {
          mainWindow.loadURL(startUrl);
        }, 1000);
      } else {
        mainWindow.loadFile(
          path.resolve(__dirname, "..", "dist", "index.html")
        );
      }
    }
  );

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "public", "icon.png");

  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 32, height: 32 });
  console.log("Icon is empty:", icon.isEmpty());
  tray = new Tray(icon);
  tray.setToolTip("Mon Application Electron");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow) mainWindow.show();
  });
}

// Gestion du démarrage de l'application
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Configuration du démarrage automatique
  app.setLoginItemSettings({
    openAtLogin: true,
  });

  // Démarrage du service en arrière-plan
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("start-background-service");
  });

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      if (permission === "media") {
        callback(true); // Autorise caméra/micro
      } else {
        callback(false);
      }
    }
  );
});

// Gestion de la fermeture de l'application
app.on("before-quit", () => {
  isQuitting = true;
});

// Gestion de l'activation de l'application (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
