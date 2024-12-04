import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { ICloudinaryResponse,  } from '../app/interfaces/file';
import config from '../config';
import DatauriParser from 'datauri/parser';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Create parser instance
const parser = new DatauriParser();

// Convert buffer to data URI
const bufferToDataURI = (fileFormat: string, buffer: Buffer) => {
  return parser.format(path.extname(fileFormat).toString(), buffer).content;
};

// Modified upload to Cloudinary function
const uploadToCloudinary = async (file: Express.Multer.File): Promise<ICloudinaryResponse> => {
  try {
    const fileFormat = file.originalname;
    const fileContent = bufferToDataURI(fileFormat, file.buffer);

    if (!fileContent) {
      throw new Error('File content is undefined');
    }

    const result = await cloudinary.uploader.upload(fileContent);

    return result;
  } catch (error) {
    throw new Error('Error uploading to Cloudinary');
  }
};

export const fileUploader = {
  upload,
  uploadToCloudinary,
};
