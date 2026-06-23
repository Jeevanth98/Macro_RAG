import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all approvals, optionally filtering by status (defaults to PENDING)
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'PENDING';
    const records = await prisma.dataApprovalQueue.findMany({
      where: { status },
      orderBy: { extractedAt: 'desc' },
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// Approve a specific data entry
router.post('/:id/approve', async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const approvalRecord = await prisma.dataApprovalQueue.findUnique({
      where: { id },
    });

    if (!approvalRecord || approvalRecord.status !== 'PENDING') {
      return res.status(404).json({ error: 'Pending approval not found' });
    }

    // Process the payload based on dataType
    const payload = JSON.parse(approvalRecord.payload);

    if (approvalRecord.dataType === 'KPI') {
      await prisma.kpi.create({
        data: {
          ...payload,
          source: approvalRecord.source,
          extractedAt: approvalRecord.extractedAt,
          validationScore: approvalRecord.validationScore,
        },
      });
    } else if (approvalRecord.dataType === 'ChartData') {
      // payload should be an array of chart data
      const chartDataWithMetadata = payload.map((d: any) => ({
        ...d,
        source: approvalRecord.source,
        extractedAt: approvalRecord.extractedAt,
        validationScore: approvalRecord.validationScore,
      }));
      
      const batchSize = 500;
      for (let i = 0; i < chartDataWithMetadata.length; i += batchSize) {
        const batch = chartDataWithMetadata.slice(i, i + batchSize);
        await prisma.chartData.createMany({ data: batch });
      }
    } else {
      return res.status(400).json({ error: 'Unknown dataType' });
    }

    // Mark as approved
    const updatedRecord = await prisma.dataApprovalQueue.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error approving data:', error);
    res.status(500).json({ error: 'Failed to approve data' });
  }
});

// Reject a specific data entry (remove it)
router.post('/:id/reject', async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const deletedRecord = await prisma.dataApprovalQueue.delete({
      where: { id },
    });
    res.json({ success: true, deletedRecord });
  } catch (error) {
    console.error('Error rejecting data:', error);
    res.status(500).json({ error: 'Failed to reject data' });
  }
});

export default router;
