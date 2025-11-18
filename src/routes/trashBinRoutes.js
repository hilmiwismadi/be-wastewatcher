const express = require('express');
const TrashBinController = require('../controllers/trashBinController');

const router = express.Router();

/**
 * @swagger
 * /api/trash-bins:
 *   get:
 *     tags:
 *       - Trash Bins
 *     summary: Get all trash bins
 *     description: Retrieve a list of all registered trash bins in the system
 *     responses:
 *       200:
 *         description: List of trash bins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrashBin'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', TrashBinController.getAll);

/**
 * @swagger
 * /api/trash-bins/status:
 *   get:
 *     tags:
 *       - Trash Bins
 *     summary: Get all trash bins with current status
 *     description: Retrieve all trash bins with their current fill status and device data
 *     responses:
 *       200:
 *         description: Trash bins with status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/TrashBin'
 *                       - type: object
 *                         properties:
 *                           devices:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Device'
 *       500:
 *         description: Internal server error
 */
router.get('/status', TrashBinController.getAllWithStatus);

/**
 * @swagger
 * /api/trash-bins/location/{area}:
 *   get:
 *     tags:
 *       - Trash Bins
 *     summary: Get trash bins by location
 *     description: Retrieve trash bins filtered by location or area
 *     parameters:
 *       - in: path
 *         name: area
 *         required: true
 *         schema:
 *           type: string
 *         description: Location or area name (e.g., 'selatan', 'kantin')
 *         example: selatan
 *     responses:
 *       200:
 *         description: Trash bins found for the specified location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrashBin'
 *       404:
 *         description: No trash bins found for location
 *       500:
 *         description: Internal server error
 */
router.get('/location/:area', TrashBinController.getByLocation);

/**
 * @swagger
 * /api/trash-bins/{id}:
 *   get:
 *     tags:
 *       - Trash Bins
 *     summary: Get specific trash bin
 *     description: Retrieve details of a specific trash bin by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trash bin ID
 *         example: TB-SELATAN-LT1
 *     responses:
 *       200:
 *         description: Trash bin found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TrashBin'
 *       404:
 *         description: Trash bin not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', TrashBinController.getById);

/**
 * @swagger
 * /api/trash-bins:
 *   post:
 *     tags:
 *       - Trash Bins
 *     summary: Create new trash bin
 *     description: Register a new trash bin in the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trashbinid
 *               - name
 *               - location
 *             properties:
 *               trashbinid:
 *                 type: string
 *                 example: TB-SELATAN-LT1
 *               name:
 *                 type: string
 *                 example: Kantin LT 1
 *               location:
 *                 type: string
 *                 example: Kantin Selatan Lantai 1
 *               latitude:
 *                 type: number
 *                 example: -6.2088
 *               longitude:
 *                 type: number
 *                 example: 106.8456
 *               capacity:
 *                 type: number
 *                 example: 100
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 example: active
 *     responses:
 *       201:
 *         description: Trash bin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TrashBin'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/', TrashBinController.create);

/**
 * @swagger
 * /api/trash-bins/{id}:
 *   put:
 *     tags:
 *       - Trash Bins
 *     summary: Update trash bin
 *     description: Update details of an existing trash bin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trash bin ID
 *         example: TB-SELATAN-LT1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kantin LT 1 Updated
 *               location:
 *                 type: string
 *                 example: Kantin Selatan Lantai 1 Updated
 *               latitude:
 *                 type: number
 *                 example: -6.2088
 *               longitude:
 *                 type: number
 *                 example: 106.8456
 *               capacity:
 *                 type: number
 *                 example: 100
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *                 example: active
 *     responses:
 *       200:
 *         description: Trash bin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TrashBin'
 *       404:
 *         description: Trash bin not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', TrashBinController.update);

/**
 * @swagger
 * /api/trash-bins/{id}:
 *   delete:
 *     tags:
 *       - Trash Bins
 *     summary: Delete trash bin
 *     description: Remove a trash bin from the system
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trash bin ID
 *         example: TB-SELATAN-LT1
 *     responses:
 *       200:
 *         description: Trash bin deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Trash bin deleted successfully
 *       404:
 *         description: Trash bin not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', TrashBinController.delete);

module.exports = router;