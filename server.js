var ciscospark = require('ciscospark/dist');
 
assert('YWYxZTZkMTctZjY3ZS00NjA1LTk2NWYtMjMyNDE5MjliNzE4MDM4NDZkZmYtZjE0');
return ciscospark.rooms.create({title: 'My First Room'})
  .then(function(room) {
    return ciscospark.messages.create({
      text: 'Howdy!',
      roomId: room.id
    });
  })
  .catch(function(reason) {
    console.log('error');
    console.error(reason);
    process.exit(1);
  });
 
 window.open('https://jabberguestsandbox.cisco.com/call/5555','popup','width=550,height=400,toolbar=no,location=no,menubar=no,status=no'); return false;