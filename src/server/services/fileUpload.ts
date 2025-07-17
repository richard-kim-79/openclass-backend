import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import { Request } from 'express';

interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  uploadPath: string;
  imageResizeOptions: {
    width: number;
    height: number;
    quality: number;
  };
}

export class FileUploadService {
  private config: FileUploadConfig;
  private storage!: multer.StorageEngine;

  constructor() {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        // 이미지
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        // 문서
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // 텍스트
        'text/plain',
        'text/csv',
        'text/html',
        // 압축
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        // 기타
        'application/json',
        'application/xml'
      ],
      uploadPath: './uploads',
      imageResizeOptions: {
        width: 1920,
        height: 1080,
        quality: 80
      }
    };

    this.initializeStorage();
    this.ensureUploadDirectory();
  }

  private initializeStorage() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = this.config.uploadPath;
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        // 보안을 위한 파일명 생성
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(file.originalname);
        const filename = `${timestamp}-${randomString}${extension}`;
        cb(null, filename);
      }
    });
  }

  private ensureUploadDirectory() {
    if (!fs.existsSync(this.config.uploadPath)) {
      fs.mkdirSync(this.config.uploadPath, { recursive: true });
    }
  }

  // 파일 필터링
  private fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // MIME 타입 검증
    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('지원하지 않는 파일 타입입니다.'));
    }

    // 파일 확장자 검증
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.html', '.zip', '.rar', '.7z', '.json', '.xml'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('지원하지 않는 파일 확장자입니다.'));
    }

    // 파일명 보안 검증
    const filename = file.originalname.toLowerCase();
    const dangerousPatterns = ['../', '..\\', '/', '\\', 'script', 'javascript', 'vbscript', 'onload', 'onerror'];
    
    for (const pattern of dangerousPatterns) {
      if (filename.includes(pattern)) {
        return cb(new Error('잘못된 파일명입니다.'));
      }
    }

    cb(null, true);
  };

  // Multer 설정
  public getUploadMiddleware(fieldName: string = 'file', maxCount: number = 1) {
    return multer({
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: this.config.maxFileSize,
        files: maxCount
      }
    }).array(fieldName, maxCount);
  }

  // 이미지 리사이징
  public async resizeImage(filePath: string, options?: Partial<typeof this.config.imageResizeOptions>): Promise<string> {
    try {
      const resizeOptions = { ...this.config.imageResizeOptions, ...options };
      const resizedPath = filePath.replace(/(\.[^.]+)$/, '_resized$1');
      
      await sharp(filePath)
        .resize(resizeOptions.width, resizeOptions.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: resizeOptions.quality })
        .toFile(resizedPath);

      // 원본 파일 삭제 (선택사항)
      // fs.unlinkSync(filePath);
      
      return resizedPath;
    } catch (error) {
      console.error('이미지 리사이징 실패:', error);
      return filePath; // 실패 시 원본 반환
    }
  }

  // 썸네일 생성
  public async generateThumbnail(filePath: string, size: number = 150): Promise<string> {
    try {
      const thumbnailPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
      
      await sharp(filePath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      console.error('썸네일 생성 실패:', error);
      return filePath;
    }
  }

  // 이미지 업로드 후 최적화(리사이즈, webp, 썸네일) 통합 처리
  public async optimizeImage(filePath: string, options?: Partial<typeof this.config.imageResizeOptions>) {
    const resizeOptions = { ...this.config.imageResizeOptions, ...options };
    const ext = path.extname(filePath).toLowerCase();
    const base = filePath.replace(ext, '');
    const resizedPath = `${base}_resized${ext}`;
    const webpPath = `${base}_resized.webp`;
    const thumbPath = `${base}_thumb${ext}`;
    const thumbWebpPath = `${base}_thumb.webp`;

    // 리사이즈(JPEG/PNG 등)
    await sharp(filePath)
      .resize(resizeOptions.width, resizeOptions.height, { fit: 'inside', withoutEnlargement: true })
      .toFile(resizedPath);

    // WebP 변환
    await sharp(resizedPath)
      .webp({ quality: resizeOptions.quality })
      .toFile(webpPath);

    // 썸네일(JPEG/PNG 등)
    await sharp(filePath)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .toFile(thumbPath);

    // 썸네일 WebP
    await sharp(filePath)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .webp({ quality: 70 })
      .toFile(thumbWebpPath);

    return {
      original: filePath,
      resized: resizedPath,
      webp: webpPath,
      thumbnail: thumbPath,
      thumbnailWebp: thumbWebpPath
    };
  }

  // 파일 정보 추출 (썸네일/웹 최적화 경로 포함)
  public getFileInfo(file: Express.Multer.File) {
    const stats = fs.statSync(file.path);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const base = file.path.replace(fileExtension, '');
    return {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: stats.size,
      mimetype: file.mimetype,
      extension: fileExtension,
      isImage: file.mimetype.startsWith('image/'),
      uploadDate: new Date(),
      hash: this.generateFileHash(file.path),
      resized: `${base}_resized${fileExtension}`,
      webp: `${base}_resized.webp`,
      thumbnail: `${base}_thumb${fileExtension}`,
      thumbnailWebp: `${base}_thumb.webp`
    };
  }

  // 파일 해시 생성
  private generateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }

  // 파일 삭제
  public deleteFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      return false;
    }
  }

  // 파일 유효성 검증
  public validateFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    // 파일 크기 검증
    if (file.size > this.config.maxFileSize) {
      return { isValid: false, error: '파일 크기가 너무 큽니다.' };
    }

    // MIME 타입 검증
    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      return { isValid: false, error: '지원하지 않는 파일 타입입니다.' };
    }

    // 파일 확장자 검증
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.html', '.zip', '.rar', '.7z', '.json', '.xml'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return { isValid: false, error: '지원하지 않는 파일 확장자입니다.' };
    }

    return { isValid: true };
  }

  // 업로드 디렉토리 정리 (오래된 파일 삭제)
  public async cleanupOldFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const files = fs.readdirSync(this.config.uploadPath);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.config.uploadPath, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      console.log(`🧹 ${deletedCount}개의 오래된 파일을 정리했습니다.`);
      return deletedCount;
    } catch (error) {
      console.error('파일 정리 실패:', error);
      return 0;
    }
  }

  // 설정 업데이트
  public updateConfig(newConfig: Partial<FileUploadConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.initializeStorage();
  }

  // 현재 설정 반환
  public getConfig(): FileUploadConfig {
    return { ...this.config };
  }
} 