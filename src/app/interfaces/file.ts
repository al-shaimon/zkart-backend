import { UploadApiResponse } from 'cloudinary';

export interface ICloudinaryResponse extends UploadApiResponse {
  // Will add any additional properties if needed
  // If not, we can use UploadApiResponse directly
}
