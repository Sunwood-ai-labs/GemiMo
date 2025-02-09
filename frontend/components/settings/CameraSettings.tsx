import { RESOLUTION_OPTIONS } from '@/lib/types/camera'

interface CameraSettingsProps {
  selectedCameraId: string
  facingMode: 'user' | 'environment'
  resolution: { width: number; height: number; label: string }
  onCameraChange: (cameraId: string) => void
  onFacingModeChange: (mode: 'user' | 'environment') => void
  onResolutionChange: (resolution: typeof RESOLUTION_OPTIONS[number]) => void
  availableCameras: Array<{ deviceId: string; label: string }>
}

export const CameraSettings: React.FC<CameraSettingsProps> = ({
  selectedCameraId,
  facingMode,
  resolution,
  onCameraChange,
  onFacingModeChange,
  onResolutionChange,
  availableCameras
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">カメラ設定</h3>
      
      {/* カメラ選択 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          使用可能なカメラ
        </label>
        <select
          value={selectedCameraId}
          onChange={(e) => onCameraChange(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {availableCameras.length === 0 ? (
            <option value="">カメラが見つかりません - カメラへのアクセスを許可してください</option>
          ) : (
            availableCameras.map((camera, index) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `カメラ ${index + 1}`}
              </option>
            ))
          )}
        </select>
        {availableCameras.length === 0 && (
          <div className="mt-2">
            <div className="text-sm text-red-500">
              カメラが検出されません。以下を確認してください：
            </div>
            <ul className="mt-1 ml-4 text-sm text-red-500 list-disc">
              <li>カメラが正しく接続されているか</li>
              <li>ブラウザにカメラの使用許可が与えられているか</li>
              <li>他のアプリケーションがカメラを使用していないか</li>
            </ul>
          </div>
        )}
      </div>

      {/* カメラの向きの設定 - すべてのデバイスで表示 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          カメラの向き設定
        </label>
        <select
          value={facingMode}
          onChange={(e) => onFacingModeChange(e.target.value as 'user' | 'environment')}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="user">内向き（ユーザー側）</option>
          <option value="environment">外向き（環境側）</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          ※ デバイスによっては向きの変更に対応していない場合があります
        </p>
      </div>

      {/* 解像度設定 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          解像度
        </label>
        <select
          value={`${resolution.width}x${resolution.height}`}
          onChange={(e) => {
            const selected = RESOLUTION_OPTIONS.find(
              opt => `${opt.width}x${opt.height}` === e.target.value
            )
            if (selected) onResolutionChange(selected)
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {RESOLUTION_OPTIONS.map(opt => (
            <option key={`${opt.width}x${opt.height}`} value={`${opt.width}x${opt.height}`}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          ※ デバイスによっては対応していない解像度があります。その場合は自動的に最適な解像度が選択されます。
        </p>
      </div>
    </div>
  )
}
