import { BadRequestException, PipeTransform } from '@nestjs/common';

export class ImageFilesPipe implements PipeTransform {
  constructor(private readonly filesAreRequired = false) {}

  transform(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      if (this.filesAreRequired) {
        throw new BadRequestException('At least one image is required');
      }

      return files;
    }

    const maxSize = 5 * 1024 * 1024;

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    for (const file of files) {
      if (file.size > maxSize) {
        throw new BadRequestException(
          `Image "${file.originalname}" should not exceed 5MB`,
        );
      }

      const extension = file.originalname.split('.').pop()?.toLowerCase();

      const validMimeType = allowedMimeTypes.includes(file.mimetype);

      const validOctetStream =
        file.mimetype === 'application/octet-stream' &&
        extension !== undefined &&
        allowedExtensions.includes(extension);

      if (!validMimeType && !validOctetStream) {
        throw new BadRequestException(
          `Image "${file.originalname}" must be JPEG, JPG, PNG, or WEBP`,
        );
      }
    }

    return files;
  }
}
