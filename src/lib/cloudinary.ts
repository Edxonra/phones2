import { v2 as cloudinary } from 'cloudinary'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Missing Cloudinary environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
})

export async function uploadImageToCloudinary(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error('Cloudinary upload failed'))
          return
        }

        resolve(result.secure_url)
      }
    )

    uploadStream.end(buffer)
  })
}

export function extractPublicId(url: string): string | null {
  try {
    const parsedUrl = new URL(url)

    if (!parsedUrl.hostname.includes('res.cloudinary.com')) {
      return null
    }

    const parts = parsedUrl.pathname.split('/').filter(Boolean)
    const uploadIndex = parts.findIndex((part) => part === 'upload')

    if (uploadIndex === -1) {
      return null
    }

    const publicIdParts = parts.slice(uploadIndex + 1)

    if (publicIdParts.length === 0) {
      return null
    }

    if (/^v\d+$/.test(publicIdParts[0])) {
      publicIdParts.shift()
    }

    const fileName = publicIdParts.join('/')
    const withoutExtension = fileName.replace(/\.[^.]+$/, '')

    return withoutExtension || null
  } catch {
    return null
  }
}

export async function deleteImageFromCloudinary(url: string): Promise<void> {
  const publicId = extractPublicId(url)

  if (!publicId) {
    return
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}
