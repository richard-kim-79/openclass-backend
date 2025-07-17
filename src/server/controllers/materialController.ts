import { Request, Response, NextFunction } from 'express';
import { getMaterialsByClassroom, createNewMaterial } from '../services/materialService';
import fs from 'fs';
import path from 'path';
import { FileUploadService } from '../services/fileUpload';

const fileUploadService = new FileUploadService();

/**
 * 자료 목록 조회
 */
export const getMaterialList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classroomId = req.params.classroomId;
    const { page = 1, limit = 20, type, search } = req.query;

    // 실제로는 DB에서 자료 목록 조회
    // const materials = await getMaterialsByClassroom(classroomId, {
    //   page: Number(page),
    //   limit: Number(limit),
    //   type: type as string,
    //   search: search as string
    // });

    // 임시 자료 데이터
    const materials = [
      {
        id: '1',
        classroom_id: classroomId,
        title: '강의 자료 1',
        description: '첫 번째 강의 자료입니다.',
        type: 'file',
        url: '/uploads/material1.pdf',
        file_path: '/uploads/material1.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        author_id: '1',
        author_name: '강사',
        download_count: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        classroom_id: classroomId,
        title: '참고 링크',
        description: '유용한 참고 자료 링크입니다.',
        type: 'link',
        url: 'https://example.com/reference',
        file_path: null,
        file_size: null,
        mime_type: null,
        author_id: '1',
        author_name: '강사',
        download_count: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return res.json({ 
      success: true, 
      data: {
        materials,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: materials.length,
          totalPages: Math.ceil(materials.length / Number(limit))
        }
      }
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * 자료 생성 (업로드)
 */
export const createMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classroomId = req.params.classroomId;
    const { title, description, type, url, authorName } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: '제목은 필수입니다.' 
      });
    }
    
    let filePath = null;
    let fileSize = null;
    let mimeType = null;
    let optimized = null;
    
    // 파일이 업로드된 경우
    if (req.file) {
      filePath = req.file.path;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
      // 이미지면 최적화
      if (mimeType && mimeType.startsWith('image/')) {
        optimized = await fileUploadService.optimizeImage(filePath);
      }
    }
    
    // 자료 데이터 생성
    const materialData: any = {
      id: Date.now().toString(),
      classroom_id: classroomId,
      title,
      description: description || '',
      type: type || (req.file ? 'file' : 'link'),
      url: url || (req.file ? `/uploads/${req.file.filename}` : ''),
      file_path: filePath,
      file_size: fileSize,
      mime_type: mimeType,
      author_id: userId,
      author_name: req.user?.name || authorName || '사용자',
      download_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (optimized) {
      materialData.resized = optimized.resized.replace(/^\.\//, '/');
      materialData.webp = optimized.webp.replace(/^\.\//, '/');
      materialData.thumbnail = optimized.thumbnail.replace(/^\.\//, '/');
      materialData.thumbnailWebp = optimized.thumbnailWebp.replace(/^\.\//, '/');
    }
    
    // 실제로는 DB에 저장
    // const newMaterial = await createNewMaterial(materialData);
    
    return res.status(201).json({ 
      success: true, 
      message: '자료가 업로드되었습니다.',
      data: materialData 
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * 자료 상세 조회
 */
export const getMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classroomId, materialId } = req.params;

    if (!classroomId || !materialId) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID와 자료 ID가 필요합니다.' 
      });
    }

    // 실제로는 DB에서 자료 조회
    // const material = await Material.findById(materialId);
    // if (!material || material.classroom_id !== classroomId) {
    //   return res.status(404).json({ 
    //     success: false, 
    //     error: '자료를 찾을 수 없습니다.' 
    //   });
    // }

    // 임시 자료 데이터
    const material = {
      id: materialId,
      classroom_id: classroomId,
      title: '테스트 자료',
      description: '테스트 자료 설명',
      type: 'file',
      url: '/uploads/test.pdf',
      file_path: '/uploads/test.pdf',
      file_size: 1024000,
      mime_type: 'application/pdf',
      author_id: '1',
      author_name: '강사',
      download_count: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return res.json({
      success: true,
      data: material
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * 자료 수정
 */
export const updateMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classroomId, materialId } = req.params;
    const { title, description, type, url } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    if (!classroomId || !materialId) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID와 자료 ID가 필요합니다.' 
      });
    }

    // 실제로는 DB에서 자료 조회 및 권한 확인
    // const material = await Material.findById(materialId);
    // if (!material || material.classroom_id !== classroomId) {
    //   return res.status(404).json({ 
    //     success: false, 
    //     error: '자료를 찾을 수 없습니다.' 
    //   });
    // }
    // if (material.author_id !== userId) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: '자료를 수정할 권한이 없습니다.' 
    //   });
    // }

    // 업데이트할 데이터
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;
    if (url) updateData.url = url;

    // 실제로는 DB에서 업데이트
    // const updatedMaterial = await Material.findByIdAndUpdate(materialId, updateData, { new: true });

    // 임시 업데이트된 데이터
    const updatedMaterial = {
      id: materialId,
      classroom_id: classroomId,
      title: title || '테스트 자료',
      description: description || '테스트 자료 설명',
      type: type || 'file',
      url: url || '/uploads/test.pdf',
      file_path: '/uploads/test.pdf',
      file_size: 1024000,
      mime_type: 'application/pdf',
      author_id: userId,
      author_name: req.user?.name || '사용자',
      download_count: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return res.json({
      success: true,
      message: '자료가 수정되었습니다.',
      data: updatedMaterial
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * 자료 삭제
 */
export const deleteMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classroomId, materialId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    if (!classroomId || !materialId) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID와 자료 ID가 필요합니다.' 
      });
    }

    // 실제로는 DB에서 자료 조회 및 권한 확인
    // const material = await Material.findById(materialId);
    // if (!material || material.classroom_id !== classroomId) {
    //   return res.status(404).json({ 
    //     success: false, 
    //     error: '자료를 찾을 수 없습니다.' 
    //   });
    // }
    // if (material.author_id !== userId) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: '자료를 삭제할 권한이 없습니다.' 
    //   });
    // }

    // 파일이 있는 경우 삭제
    // if (material.file_path && fs.existsSync(material.file_path)) {
    //   fs.unlinkSync(material.file_path);
    // }

    // 실제로는 DB에서 삭제
    // await Material.findByIdAndDelete(materialId);

    return res.json({
      success: true,
      message: '자료가 삭제되었습니다.'
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * 자료 다운로드
 */
export const downloadMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const materialId = req.params.materialId;
    
    // 실제로는 DB에서 자료 정보 조회
    // const material = await Material.findById(materialId);
    // if (!material) {
    //   return res.status(404).json({ success: false, error: '자료를 찾을 수 없습니다' });
    // }
    
    // 임시 자료 데이터
    const material = {
      id: materialId,
      title: '테스트 자료',
      file_path: '/uploads/test.pdf',
      mime_type: 'application/pdf'
    };
    
    // 파일 경로 확인
    if (!material.file_path || !fs.existsSync(material.file_path)) {
      return res.status(404).json({ success: false, error: '파일을 찾을 수 없습니다' });
    }
    
    // 다운로드 카운트 증가 (실제로는 DB에서 업데이트)
    // await Material.findByIdAndUpdate(materialId, { $inc: { download_count: 1 } });
    
    // 파일 스트림 생성
    const fileStream = fs.createReadStream(material.file_path);
    const fileName = path.basename(material.file_path);
    
    // 헤더 설정
    res.setHeader('Content-Type', material.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // 파일 전송
    return fileStream.pipe(res);
  } catch (err) {
    return next(err);
  }
}; 