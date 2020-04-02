const { sendPushToTrackers } = require('./toTrackers')
const { sendPushToConfirmTrack } = require('./toTrackers')

//every 50 sec check if there are late late tracks and send notifications to the trackers
sendPushToTrackers()

//every 50 sec check if there are tracks needed confirmation from trackee and send notifications to these trackees
sendPushToConfirmTrack()
