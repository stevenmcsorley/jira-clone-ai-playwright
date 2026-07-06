/**
 * Workspace icons: a small set of monochrome (single-colour) glyphs plus support
 * for a custom uploaded image. Rendering precedence is: custom image → named
 * icon → initials fallback. Keep the ids stable — they are persisted per workspace.
 */

export interface WorkspaceIconDef {
  id: string
  label: string
  /** 20x20 viewBox, single fill path so it reads as one monochrome glyph. */
  path: string
}

export const WORKSPACE_ICONS: WorkspaceIconDef[] = [
  { id: 'bolt', label: 'Bolt', path: 'M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z' },
  { id: 'fire', label: 'Fire', path: 'M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z' },
  { id: 'star', label: 'Star', path: 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' },
  { id: 'beaker', label: 'Beaker', path: 'M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z' },
  { id: 'chart', label: 'Chart', path: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z' },
  { id: 'globe', label: 'Globe', path: 'M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z' },
  { id: 'flag', label: 'Flag', path: 'M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z' },
  { id: 'heart', label: 'Heart', path: 'M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' },
  { id: 'sparkles', label: 'Sparkles', path: 'M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 8.134a1 1 0 010 1.732l-3.354.933-1.18 4.455a1 1 0 01-1.933 0L9.854 10.8 6.5 9.866a1 1 0 010-1.732l3.354-.933 1.18-4.455A1 1 0 0112 2z' },
  { id: 'moon', label: 'Moon', path: 'M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' },
  { id: 'bookmark', label: 'Bookmark', path: 'M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z' },
  { id: 'stack', label: 'Stack', path: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' },
]

const ICON_BY_ID = new Map(WORKSPACE_ICONS.map(i => [i.id, i]))

export const workspaceInitials = (name?: string): string =>
  (name || 'W')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

interface WorkspaceIconProps {
  name?: string
  icon?: string | null
  iconImage?: string | null
  /** Tailwind size classes for the square, e.g. "w-8 h-8". */
  className?: string
  /** Tailwind text-size for the glyph/initials, e.g. "text-sm". */
  textClassName?: string
}

/** Renders a workspace's icon square: custom image → monochrome glyph → initials. */
export const WorkspaceIcon = ({
  name,
  icon,
  iconImage,
  className = 'w-8 h-8',
  textClassName = 'text-sm',
}: WorkspaceIconProps) => {
  const base = `bg-blue-600 text-white rounded flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`

  if (iconImage) {
    return (
      <div className={base}>
        <img src={iconImage} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }

  const def = icon ? ICON_BY_ID.get(icon) : undefined
  if (def) {
    return (
      <div className={base}>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3/5 h-3/5" aria-hidden="true">
          <path d={def.path} />
        </svg>
      </div>
    )
  }

  return (
    <div className={base}>
      <span className={`font-medium ${textClassName}`}>{workspaceInitials(name)}</span>
    </div>
  )
}

export interface ResizedImage {
  dataUrl: string
}

export const ICON_IMAGE_MAX_BYTES = 3 * 1024 * 1024 // 3MB source cap
export const ICON_IMAGE_TARGET_PX = 256

/**
 * Loads an image file, rejects oversized/non-image files, and returns a square
 * data URL downscaled to at most ICON_IMAGE_TARGET_PX. Runs entirely client-side.
 */
export const resizeImageToIcon = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (PNG, JPG or WebP).'))
      return
    }
    if (file.size > ICON_IMAGE_MAX_BYTES) {
      reject(new Error('Image is too large — please use one under 3MB.'))
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const size = Math.min(ICON_IMAGE_TARGET_PX, Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not process the image.'))
        return
      }
      // Cover-crop to a centred square so the icon fills its tile.
      const scale = Math.max(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That image could not be loaded.'))
    }
    img.src = url
  })
