const { v4: uuid } = require('uuid');
const { Router } = require('express');
const router = Router();

const roomIdList = [];

// /api/room/create
router.post('/create', (req, res) => {
  try {
    const newRoomId = uuid();
    while (roomIdList !== undefined && roomIdList.includes(newRoomId))
      newRoomId = uuid();

    roomIdList.push(newRoomId);
    res.status(201).json({ link: newRoomId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// /api/room/join
router.post('/join', (req, res) => {
  try {
    const { roomId } = req.body;
    if (roomIdList !== undefined && !roomIdList.includes(roomId))
      res.status(404).json({ message: `Room with id ${roomId} doesn't exist` });
    else res.status(200).json({ message: 'Successfully joined' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
