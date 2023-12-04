const { addMessage, getMessages, deleteMessage, updateMessage } = require("../controllers/messageController");
const router = require("express").Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);
router.put('/updatemsg/', updateMessage);
router.delete('/deletemsg/', deleteMessage);

module.exports = router;
