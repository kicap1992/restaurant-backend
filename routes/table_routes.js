const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const fs = require('fs');
const mysql = require('mysql');
dotenv.config();

const path = require('path');
// const fs = require('fs');

const socket = require('../socket');
const io = socket.getIO();
const the_socket = io.sockets;


// Load environment variables from .env file


// Connect to the MySQL database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
    } else {
        console.log('Connected to MySQL database in login_routes.js');
    }
});

// Define a route for getting the table.svg file
router.get('/', (req, res) => {
    // Read the table.svg file from disk
    fs.readFile('table.svg', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal server error');
        } else {
            const query = `SELECT * FROM tb_reservasi_meja`;

            let table = data.toString().replace(new RegExp('id="bar"', 'g'), 'fill="white"');
            try {
                connection.query(query, (err, results) => {

                    if (err) {
                        console.error('Error executing query:', err);
                        res.status(500).json({ message: 'Internal server error' });
                    } else {
                        // loop data
                        results.forEach(element => {
                            let color;
                            if (element.status == 'booking') {
                                // red color
                                color = 'rgb(255, 0, 0)';
                            } else if (element.status == 'Tidak Tersedia') {
                                // grey color
                                color = 'rgb(128, 128, 128)';
                            }

                            table = table.toString().replace(new RegExp('id="meja_' + element.id_meja + '"', 'g'), 'fill="' + color + '"');
                            table = table.toString().replace(new RegExp('id="huruf_' + element.id_meja + '"', 'g'), 'fill="white"');
                        })

                        res.send(table);
                    }
                })
            } catch (error) {
                res.send(table);
            }



            // search id="meja_1" and replace the fill color to fill="green"
            // let table = data;

            // res.send(table);


            // // show the table.svg file
            // res.set('Content-Type', 'image/svg+xml');
            // res.send(data);
        }
    });
});


// get /detail/:id_meja
router.get('/detail/:id_meja', (req, res) => {
    const { id_meja } = req.params;

    if (id_meja == null || id_meja == undefined || id_meja == '') return res.status(400).json({ message: 'id_meja is required' });


    // Execute a SELECT query to find the user with the given username and hashed password
    const check_data = `SELECT * FROM tb_reservasi_meja WHERE id_meja = ?`;

    // count data
    try {
        connection.query(check_data, [id_meja], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).json({ message: 'Internal server error' });
            } else if (results.length === 1) {
                // Return the user object
                res.status(200).json({ message: 'success', bool: true, data: results[0] });
            } else {
                // Return an error message
                res.status(200).json({ message: 'success', bool: false });
            }

        });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }

    // res.json({ message: 'success' , id_meja: id_meja});

});

// get /detail
router.get('/detail', (req, res) => {
    const query = `SELECT * FROM tb_reservasi_meja`;

    try {
        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).json({ message: 'Internal server error' });
            } else {
                // Return the user object
                res.status(200).json({ message: 'success', bool: true, data: results });
            }

        });

    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

// post /detail/:id_meja
router.post('/reservation/:id_meja', (req, res) => {
    const { id_meja } = req.params;
    const { id_user, status } = req.body;

    if (id_meja == null || id_meja == undefined || id_meja == '') return res.status(400).json({ message: 'id_meja is required' });

    // if (id_user == null || id_user == undefined || id_user == '') return res.status(400).json({ message: 'id_user is required' });

    if (status == null || status == undefined || status == '') return res.status(400).json({ message: 'status is required' });

    // Execute a SELECT query to find the user with the given username and hashed password
    const check_data = `SELECT * FROM tb_reservasi_meja WHERE id_meja = ?`;

    if (status == 'Tersedia') {
        const query = "DELETE FROM tb_reservasi_meja WHERE id_meja = ?";
        connection.query(query, [id_meja], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                return res.status(500).json({ message: 'Internal server error' });
            } else {
                // Return the user object
                console.log("success delete data menjadi tersedia");
                // socket.emit('table', {});
                io.emit('table_admin', {});
                return res.status(200).json({ message: 'success', bool: true, data: results });
            }
        })
        return;
    }

    // count data
    try {
        connection.query(check_data, [id_meja], (err, results) => {
            // create a time now
            const date = new Date();
            let jam_booking = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
            jam = status == 'booking' ? jam_booking : null;
            if (err) {
                console.error('Error executing query:', err);
                return res.status(500).json({ message: 'Internal server error' });
            } else if (results.length === 1) {
                const query = `UPDATE tb_reservasi_meja SET id_user = ?, jam_booking = ? , status = ? WHERE id_meja = ?`;
                connection.query(query, [id_user, jam, status, id_meja], (err, results) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        return res.status(500).json({ message: 'Internal server error' });
                    } else {
                        // Return the user object
                        // socket.emit('table', {});
                        io.emit('table_admin', {});
                        console.log("success update data");
                        return res.status(200).json({ message: 'success', bool: true, data: results });
                    }

                })
            } else {
                const query = `INSERT INTO tb_reservasi_meja (id_meja, id_user, jam_booking, status) VALUES (?, ?, ?, ?)`;


                connection.query(query, [id_meja, id_user, jam, status], (err, results) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        return res.status(500).json({ message: 'Internal server error' });
                    } else {
                        // Return the user object
                        // socket.emit('table', {});
                        io.emit('table_admin', {});
                        console.log("success insert data");
                        return res.status(200).json({ message: 'success', bool: true, data: results });
                    }

                })
            }

        });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }

})


// get /user/:id_user
router.get('/user/:id_user', (req, res) => {
    const { id_user } = req.params;

    if (id_user == null || id_user == undefined || id_user == '') return res.status(400).json({ message: 'id_user is required' });

    const check_data = `SELECT * FROM tb_user WHERE id_user = ?`;

    try {
        connection.query(check_data, [id_user], (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.status(500).json({ message: 'Internal server error' });
            } else if (results.length === 1) {
                // Return the user object
                res.status(200).json({ message: 'success', bool: true, data: results[0] });
            } else {
                // Return an error message
                res.status(401).json({ message: 'Not found' });
            }

        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }

})

// post makanan
router.post('/makanan', (req, res) => {
    const { nama_makanan, harga_makanan, deskripsi_makanan } = req.body;
    // get image from req.files
    const image = req.files.image;
    // console.log (nama_makanan);
    // console.log (harga_makanan);
    // console.log (deskripsi_makanan);
    // console.log (image);

    // check last auto increment id
    const check_data = `SELECT * FROM tb_menu_makan ORDER BY id_makanan DESC LIMIT 1`;
    connection.query(check_data, (err, results) => {

        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ message: 'Internal server error' });
        } else if (results.length == 0) {
            const index = 1;
            

            const uploadDir = path.join(__dirname, '../assets/makanan/'+index);

            // Create the directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Upload the image
            image.mv(path.join(uploadDir, image.name), (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error uploading image' });
                }


            });

            const query = `INSERT INTO tb_menu_makan (nama_makanan, harga_makanan, deskripsi_makanan, img_url,id_makanan) VALUES (?, ?, ?, ?,?)`;

            connection.query(query, [nama_makanan, harga_makanan, deskripsi_makanan, index + '/' + image.name, index], (err, results) => {
                if (err) {
                    console.error('Error executing query:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                } else {
                    // Return the user object
                    socket.emit('makanan');
                    return res.status(200).json({ message: 'success', bool: true, data: results });
                }
            });


        } else {
            const index = results[0].id_makanan + 1;

            const uploadDir = path.join(__dirname, '../assets/makanan/'+index);

            // Create the directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Upload the image
            image.mv(path.join(uploadDir, image.name), (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error uploading image' });
                }
            })

            const query = `INSERT INTO tb_menu_makan (nama_makanan, harga_makanan, deskripsi_makanan, img_url) VALUES (?, ?, ?, ?)`;
            
            connection.query(query, [nama_makanan, harga_makanan, deskripsi_makanan, index + '/' + image.name], (err, results) => {
                if (err) {
                    console.error('Error executing query:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                } else {
                    // Return the user object
                    socket.emit('makanan');
                    return res.status(200).json({ message: 'success', bool: true, data: results });
                }
            })
        }

        // return res.status(200).json({ message: 'success', bool: true, data: results });
    })

    // return res.status(200).json({ message: 'success', bool: true, data: req.body });
})

// get makanan
router.get('/makanan', (req, res) => {
    const query = `SELECT * FROM tb_menu_makan`;

    try {
        connection.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
               return res.status(500).json({ message: 'Internal server error' });
            } else {
                // Return the user object
               return res.status(200).json({ message: 'success', bool: true, data: results });
            }

        });

    }
    catch (error) {
        console.log(error);
       return res.status(500).json({ message: 'Internal server error' });
    }
})

module.exports = router;