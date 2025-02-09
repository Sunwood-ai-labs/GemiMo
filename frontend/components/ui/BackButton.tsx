import { useRouter } from 'next/navigation'

interface BackButtonProps {
  className?: string
}

export const BackButton: React.FC<BackButtonProps> = ({ className = '' }) => {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm transition-colors ${className}`}
    >
      <svg
        className="w-5 h-5 mr-1 -ml-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      戻る
    </button>
  )
}
