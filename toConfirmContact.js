const {firestore} = require('./config');

//send push notification to tokens
//set timer to run function every xx min
sendPushToConfirmContact = function () {
  const req = require('request');
  const timeout = 50000;
  getUserPushTokens()
  .then (tokens => {
  tokens.map(token => {
  req.post({
    headers: {
      'host': 'exp.host',
      'accept': 'application/json',
      'accept-encoding': 'gzip, deflate',
      'content-type': 'application/json',
    },
    url: 'https://exp.host/--/api/v2/push/send',
    body: {
      "to": token.pushToken,
      "sound": "default",
      "body": `Hey! You have pending contact requests.`
    },
    json: true,
    function(error, response, body){
      // resp.send(body)
    }
  })
  console.log(`"Confirm track notification" sent to traker: ${token.pushToken}`)
})
console.log(`Next batch will be sent in ${timeout/1000} sec`)
})
setTimeout(sendPushToConfirmContact, timeout);
}



//2. get trackers' push notifications tokens
const getUserPushTokens = async () => {
  try {
    let uidArr = await getRequestedContacts();
    let pushTokensArr = []
    for (let i = 0; i< uidArr.length; i++) {
      let user = await firestore
      .collection('users')
      .doc(uidArr[i].uid)
      .get()
      let token = user.data().pushToken
      if (token) {
      pushTokensArr.push({
        pushToken: token,
      })
    }}
    console.log('got all confirm track tokens: ', pushTokensArr)
    return pushTokensArr
  } catch (e) {
    console.error(e)
  }
}


//1. Get all users we need to send notifications to cofirm contact
const getRequestedContacts = async () => {
  try {
    let requestedUsers = []
    let users = await firestore
    .collection('users')
    .get()
    users.forEach(async user => {
      let userData = user.data();
      if (userData.associatedUsers) {
        let contacts = userData.associatedUsers;
        //loop through associated contacts looking for status 'requested',
        //if found, push user's id to the array and change all 'requested'
        //statuses to 'requested-inviteSent', so we are not sending them
        //notifications more than one time
        let isRequestExists = false
        contacts.forEach(contact => {
          if (contact.status === 'requested' && !contact.notification) {
            contact.notification = 'sent'
            isRequestExists = true
          }
        })
        if (isRequestExists) {
          requestedUsers.push({uid: userData.uid})
          await firestore
            .collection('users')
            .doc(userData.uid)
            .update({associatedUsers: contacts})
        }
      }
      })
    console.log('got all users with requested contacts: ', requestedUsers)
    return requestedUsers;
  } catch (e) {
    console.error(e)
  }
}

//for testing
// sendPushToConfirmContact()
// getUserPushTokens()
// getRequestedContacts()

exports.sendPushToConfirmContact = sendPushToConfirmContact
