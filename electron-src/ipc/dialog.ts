import { ipcMain, dialog } from 'electron';

/**
 * ダイアログ関連のIPCハンドラを設定する
 */
export function setupDialogIpcHandlers(): void {
  // ファイル選択ダイアログ
  ipcMain.handle('dialog:open-file', async (_, options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      ...options
    });
    
    if (canceled || filePaths.length === 0) {
      return null;
    }
    
    return filePaths[0];
  });
} 