import { Request, Response } from 'express';
import { 
  getClassroomList as getClassroomListService, 
  getClassroomById, 
  createClassroom as createClassroomService, 
  updateClassroom as updateClassroomService, 
  deleteClassroom as deleteClassroomService, 
  getClassroomsByTeacher 
} from '../services/classroomService';

/**
 * 강의실 목록 조회
 */
export const getClassroomList = async (req: Request, res: Response) => {
  try {
    const classrooms = await getClassroomListService();
    return res.json({ 
      success: true, 
      data: classrooms 
    });
  } catch (error) {
    console.error('강의실 목록 조회 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '강의실 목록 조회에 실패했습니다.' 
    });
  }
};

/**
 * 강의실 생성
 */
export const createClassroom = async (req: Request, res: Response) => {
  try {
    const { title, description, category, maxStudents, isPublic } = req.body;
    const instructorId = req.user?.id;

    if (!instructorId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    // 필수 필드 검증
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: '제목과 설명은 필수입니다.' 
      });
    }

    // 강의실 데이터 생성
    const classroomData = {
      id: Date.now().toString(),
      title,
      description,
      teacher_id: instructorId,
      teacher_name: req.user?.name || '사용자',
      is_public: isPublic !== false, // 기본값 true
      student_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newClassroom = await createClassroomService(classroomData);

    return res.status(201).json({
      success: true,
      message: '강의실이 생성되었습니다.',
      data: newClassroom
    });
  } catch (error) {
    console.error('강의실 생성 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '강의실 생성 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 강의실 상세 조회
 */
export const getClassroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID가 필요합니다.' 
      });
    }

    const classroom = await getClassroomById(id);

    return res.json({
      success: true,
      data: classroom
    });
  } catch (error) {
    console.error('강의실 조회 실패:', error);
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return res.status(404).json({ 
        success: false, 
        error: '강의실을 찾을 수 없습니다.' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: '강의실 조회 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 강의실 수정
 */
export const updateClassroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, maxStudents, isPublic } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID가 필요합니다.' 
      });
    }

    // 업데이트할 데이터
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (maxStudents !== undefined) updateData.student_count = maxStudents;
    if (isPublic !== undefined) updateData.is_public = isPublic;
    
    // teacher_name은 현재 사용자 이름으로 설정
    updateData.teacher_name = req.user?.name || '사용자';

    const updatedClassroom = await updateClassroomService(id, updateData);

    return res.json({
      success: true,
      message: '강의실이 수정되었습니다.',
      data: updatedClassroom
    });
  } catch (error) {
    console.error('강의실 수정 실패:', error);
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return res.status(404).json({ 
        success: false, 
        error: '수정할 강의실을 찾을 수 없습니다.' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: '강의실 수정 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 강의실 삭제
 */
export const deleteClassroom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID가 필요합니다.' 
      });
    }

    await deleteClassroomService(id);

    return res.json({
      success: true,
      message: '강의실이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('강의실 삭제 실패:', error);
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return res.status(404).json({ 
        success: false, 
        error: '삭제할 강의실을 찾을 수 없습니다.' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: '강의실 삭제 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 내 강의실 목록 조회
 */
export const getMyClassrooms = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    const classrooms = await getClassroomsByTeacher(userId);

    return res.json({
      success: true,
      data: classrooms
    });
  } catch (error) {
    console.error('내 강의실 목록 조회 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '내 강의실 목록 조회 중 오류가 발생했습니다.' 
    });
  }
}; 