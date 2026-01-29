import { useState, useRef, useEffect } from 'react'
import { Edit2, X, Upload, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api, { getFileUrl } from '../utils/api'

/**
 * ProfileImage Component
 * Displays user profile image with initials fallback
 * Includes pen icon for upload/edit/delete functionality
 * 
 * @param {Object} props
 * @param {string} props.imageUrl - Current profile image URL
 * @param {string} props.name - User's full name for initials
 * @param {number} props.size - Size of the image (default: 128)
 * @param {boolean} props.editable - Whether the image can be edited (default: true)
 * @param {Function} props.onImageChange - Callback when image is updated
 * @param {string} props.className - Additional CSS classes
 */
function ProfileImage({ 
  imageUrl, 
  name = 'User', 
  size = 128, 
  editable = true,
  onImageChange,
  className = ''
}) {
  const { t } = useTranslation('common')
  const { t: tForms } = useTranslation('forms')
  const { t: tErrors } = useTranslation('errors')
  const [currentImage, setCurrentImage] = useState(imageUrl || '')
  const [uploading, setUploading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const fileInputRef = useRef(null)

  // Generate initials from name
  const getInitials = (fullName) => {
    if (!fullName) return 'U'
    const parts = fullName.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return 'U'
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U'
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(name)

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(tErrors('invalidFileType', { defaultValue: 'Please select an image file (JPEG, PNG, GIF, or WebP)' }))
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(tErrors('fileTooLarge', { maxSize: '5MB', defaultValue: 'File size must be less than 5MB' }))
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('profileImage', file)

      const response = await api.post('/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data?.success) {
        const newImageUrl = response.data.data.profileImage
        // Construct full URL using backend base URL
        const fullImageUrl = getFileUrl(newImageUrl)
        
        setCurrentImage(fullImageUrl)
        if (onImageChange) {
          // Pass full URL for display
          onImageChange(fullImageUrl)
        }
        setShowMenu(false)
        
        // Trigger global refresh of user data to update profile image everywhere
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
          detail: { profileImage: newImageUrl } 
        }))
        
        alert(t('profilePictureUploaded', { defaultValue: 'Profile picture uploaded successfully!' }))
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(error.response?.data?.message || tErrors('fileUploadFailed', { defaultValue: 'Failed to upload picture' }))
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm(t('confirmRemoveProfilePicture', { defaultValue: 'Are you sure you want to remove your profile picture?' }))) {
      return
    }

    try {
      setUploading(true)
      await api.delete('/upload/profile-picture')
      
      setCurrentImage('')
      if (onImageChange) {
        onImageChange('')
      }
      setShowMenu(false)
      alert(t('profilePictureRemoved', { defaultValue: 'Profile picture removed successfully!' }))
    } catch (error) {
      console.error('Delete error:', error)
      alert(error.response?.data?.message || tErrors('fileUploadFailed', { defaultValue: 'Failed to remove picture' }))
    } finally {
      setUploading(false)
    }
  }

  // Update when imageUrl prop changes
  useEffect(() => {
    if (imageUrl) {
      // Convert relative path to full backend URL
      const fullUrl = getFileUrl(imageUrl)
      setCurrentImage(fullUrl)
    } else {
      setCurrentImage('')
    }
  }, [imageUrl])

  const imageSize = size
  const iconSize = Math.max(16, size / 8)

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Profile Image or Initials */}
      <div
        className="relative rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
        style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              console.error('Failed to load profile image:', currentImage)
              setCurrentImage('') // Clear invalid image URL
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold"
            style={{ fontSize: `${imageSize * 0.4}px` }}
          >
            {initials}
          </div>
        )}

        {/* Loading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
            <Loader2 className="animate-spin text-white" size={iconSize * 1.5} />
          </div>
        )}

        {/* Edit Button (Pen Icon) */}
        {editable && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 rounded-full group">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl"
              title={t('editProfilePicture', { defaultValue: 'Edit profile picture' })}
            >
              <Edit2 size={iconSize} className="text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {showMenu && editable && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[180px]">
            <div className="py-1">
              <button
                onClick={() => {
                  fileInputRef.current?.click()
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                disabled={uploading}
              >
                <Upload size={16} />
                {currentImage ? t('changePicture', { defaultValue: 'Change Picture' }) : t('uploadPicture', { defaultValue: 'Upload Picture' })}
              </button>
              
              {currentImage && (
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  disabled={uploading}
                >
                  <X size={16} />
                  {t('removePicture', { defaultValue: 'Remove Picture' })}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default ProfileImage

