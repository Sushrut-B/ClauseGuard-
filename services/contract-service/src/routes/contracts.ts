import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { upload } from '../config/multer'
import {
  uploadContract,
  listContracts,
  getContract,
  getContractText,
  deleteContract,
  updateLifecycleStage,
} from '../controllers/contractController'
const router = Router()
router.post('/upload', authenticate, upload.single('file'), uploadContract)
router.get('/', authenticate, listContracts)
router.get('/:id', authenticate, getContract)
router.get('/:id/text', authenticate, getContractText)
router.delete('/:id', authenticate, deleteContract)
router.patch('/:id/stage', authenticate, updateLifecycleStage)
export default router