// server.js
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 8080;

var mceliece = require("./mceliece");


const crypto = require('crypto');

// Generate a 32-byte AES key
const encryptionKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// Handle incoming socket connections
io.on('connection', (socket) => {
    console.log('a user connected');

    // Handle incoming new user event
    socket.on("new user", (username) => {
        console.log(`User ${username} connected`);
        socket.username = username;
    });

    // Handle incoming chat messages
    socket.on('chat message', (message) => {
        const username = socket.username;
        // Create a Cipher object with the AES algorithm and CBC mode
        const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);

        // Encrypt the message using the AES key
        let aesEncrypted = cipher.update(message, 'utf8', 'base64');
        aesEncrypted += cipher.final('base64');

        // console.log('encrypted message: ' + aes_encrypted);


        //RSA stuff
        // Generate a McEliece key pair
        const keyPair = mceliece.keyPair();

        // Encrypt the AES key using McEliece
        const aesKeyArray = new Uint8Array(encryptionKey);
        const encryptedAesKey = mceliece.encrypt(aesKeyArray, keyPair.publicKey);


        // console.log("\nRSA Encrypted data:", encryptedData.toString("base64"));

        // Decrypt the AES key using McEliece
        const decryptedAesKeyArray = mceliece.decrypt(encryptedAesKey, keyPair.privateKey);
        const decryptedAesKey = Buffer.from(decryptedAesKeyArray).toString('hex');



        // console.log("\nRSA Decrypted data:", decryptedData.toString());
        // Decrypt the message using the decrypted AES key
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(decryptedAesKey, 'hex'), iv);
        let aesDecrypted = decipher.update(aesEncrypted, 'base64', 'utf8');
        aesDecrypted += decipher.final('utf8');
        // // Create a Decipher object with the AES algorithm and CBC mode
        // const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(decryptedData), iv);

        // // Decrypt the message using the AES key
        // let aes_decrypted = decipher.update(aes_encrypted, 'base64', 'utf8');
        // aes_decrypted += decipher.final('utf8');

        console.log('decrypted message: ' + aesDecrypted);

        // Broadcast both the encrypted and decrypted messages to all connected clients
        // io.emit('chat message', { encrypted: aes_encrypted, decrypted: aes_decrypted });
        io.emit("chat message", { username: username, decrypted: aesDecrypted });
    });

    // Handle socket disconnections
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
// Start the server
http.listen(port, () => {
    console.log(`listening on *:${port}\nImplemented using AES+McEliece`);
    // console.log("AES+RSA")
});
