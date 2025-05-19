const cloudinary = require("../utils/cloudinary");
const webpush = require('../webpush')
module.exports = (connection) => {
    return {
        consultar: async (req, res) => {
            try {

                const [promociones] = await connection.promise().query(
                    `SELECT 
                        p.idpromocion,
                        p.empresa_idempresa,
                        p.categoria_idcategoria,
                        p.nombre,
                        p.descripcion,
                        p.precio,
                        p.vigenciainicio,
                        p.vigenciafin,
                        p.tipo
                     FROM promocion p
                     
                     WHERE p.eliminado = 0`
                );


                if (promociones.length === 0) {
                    return res.status(404).json({ message: 'No se encontraron promociones' });
                }


                const promocionesConImagenes = await Promise.all(
                    promociones.map(async (promocion) => {
                        const [imagenes] = await connection.promise().query(
                            'SELECT idimagen, url, public_id FROM imagen WHERE promocion_idpromocion = ?',
                            [promocion.idpromocion]
                        );
                        return {
                            ...promocion,
                            imagenes: imagenes.map(img => ({
                                id: img.idimagen,
                                url: img.url,
                                public_id: img.public_id
                            }))
                        };
                    })
                );

                res.status(200).json(promocionesConImagenes);
            } catch (error) {
                console.error('Error al consultar promociones:', error);
                res.status(500).json({ message: 'Error al consultar promociones' });
            }
        },

        consultarId: async (req, res) => {
            const { id } = req.params;

            try {

                const [promociones] = await connection.promise().query(
                    `SELECT 
                        p.idpromocion,
                        p.empresa_idempresa,
                        p.categoria_idcategoria,
                        p.nombre,
                        p.descripcion,
                        p.precio,
                        p.vigenciainicio,
                        p.vigenciafin,
                        p.tipo
                     FROM promocion p               
                     WHERE p.idpromocion = ? AND p.eliminado = 0`,
                    [id]
                );


                if (promociones.length === 0) {
                    return res.status(404).json({ message: 'Promoción no encontrada' });
                }

                const promocion = promociones[0];


                const [imagenes] = await connection.promise().query(
                    'SELECT idimagen, url, public_id FROM imagen WHERE promocion_idpromocion = ?',
                    [id]
                );


                const respuesta = {
                    ...promocion,
                    imagenes: imagenes.map(img => ({
                        id: img.idimagen,
                        url: img.url,
                        public_id: img.public_id
                    }))
                };

                res.status(200).json(respuesta);
            } catch (error) {
                console.error('Error al consultar promoción:', error);
                res.status(500).json({ message: 'Error al consultar promoción' });
            }
        },

        promocion: async (req, res) => {
            const {
                empresa_idempresa,
                categoria_idcategoria,
                nombre,
                descripcion,
                precio,
                vigenciainicio,
                vigenciafin,
                tipo,
            } = req.body;

            try {

                const [empresaResult] = await connection.promise().query(
                    'SELECT idempresa FROM empresa WHERE idempresa = ?',
                    [empresa_idempresa]
                );
                if (empresaResult.length === 0) {
                    return res.status(400).json({ message: 'La empresa especificada no existe' });
                }

                const [categoriaResult] = await connection.promise().query(
                    'SELECT idcategoria FROM categoria WHERE idcategoria = ?',
                    [categoria_idcategoria]
                );
                if (categoriaResult.length === 0) {
                    return res.status(400).json({ message: 'La categoría especificada no existe' });
                }


                const [result] = await connection.promise().query(
                    'INSERT INTO promocion (empresa_idempresa, categoria_idcategoria, nombre, descripcion, precio, vigenciainicio, vigenciafin, tipo, eliminado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [empresa_idempresa, categoria_idcategoria, nombre, descripcion, precio, vigenciainicio, vigenciafin, tipo, 0]
                );

                const promocionId = result.insertId;


                if (req.files && req.files.length > 0) {
                    const uploadPromises = req.files.map((file) => {
                        return new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream(
                                {
                                    resource_type: "image",
                                    transformation: [
                                        { width: 600, height: 450, crop: "limit" },
                                        { quality: "auto", fetch_format: "auto" }
                                    ]
                                },
                                (error, result) => {
                                    if (error) {
                                        reject(error);
                                    } else {
                                        resolve(result);
                                    }
                                }
                            );

                            uploadStream.end(file.buffer);
                        });
                    });


                    const imageResults = await Promise.all(uploadPromises);

                    const insertPromises = imageResults.map((image) => {
                        return new Promise((resolve, reject) => {
                            connection.query(
                                "INSERT INTO imagen (url, public_id, promocion_idpromocion) VALUES (?, ?, ?)",
                                [image.secure_url, image.public_id, promocionId],
                                (err, result) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve(result);
                                    }
                                }
                            );
                        });
                    });

                    await Promise.all(insertPromises);
                }

                res.status(201).json({ message: 'Promoción registrada con imágenes', promocionId });
            } catch (error) {
                console.error('Error al registrar promoción:', error);
                res.status(500).json({ message: 'Error al registrar promoción' });
            }
        },

        actualizarPromocion: async (req, res) => {
            const promocionId = req.params.id;
            const {
                empresa_idempresa, categoria_idcategoria, nombre, descripcion, precio, vigenciainicio, vigenciafin, tipo, imagenes_a_eliminar
            } = req.body;

            try {

                const [promocionExistente] = await connection.promise().query(
                    'SELECT * FROM promocion WHERE idpromocion = ? AND eliminado = 0',
                    [promocionId]
                );

                if (promocionExistente.length === 0) {
                    return res.status(404).json({ message: 'Promoción no encontrada' });
                }


                if (empresa_idempresa) {
                    const [empresaResult] = await connection.promise().query(
                        'SELECT idempresa FROM empresa WHERE idempresa = ?',
                        [empresa_idempresa]
                    );
                    if (empresaResult.length === 0) {
                        return res.status(400).json({ message: 'La empresa especificada no existe' });
                    }
                }


                if (categoria_idcategoria) {
                    const [categoriaResult] = await connection.promise().query(
                        'SELECT idcategoria FROM categoria WHERE idcategoria = ?',
                        [categoria_idcategoria]
                    );
                    if (categoriaResult.length === 0) {
                        return res.status(400).json({ message: 'La categoría especificada no existe' });
                    }
                }


                const updateFields = {};
                const updateValues = [];

                if (empresa_idempresa) {
                    updateFields.empresa_idempresa = empresa_idempresa;
                    updateValues.push(empresa_idempresa);
                }
                if (categoria_idcategoria) {
                    updateFields.categoria_idcategoria = categoria_idcategoria;
                    updateValues.push(categoria_idcategoria);
                }
                if (nombre) {
                    updateFields.nombre = nombre;
                    updateValues.push(nombre);
                }
                if (descripcion) {
                    updateFields.descripcion = descripcion;
                    updateValues.push(descripcion);
                }
                if (precio) {
                    updateFields.precio = precio;
                    updateValues.push(precio);
                }
                if (vigenciainicio) {
                    updateFields.vigenciainicio = vigenciainicio;
                    updateValues.push(vigenciainicio);
                }
                if (vigenciafin) {
                    updateFields.vigenciafin = vigenciafin;
                    updateValues.push(vigenciafin);
                }
                if (tipo) {
                    updateFields.tipo = tipo;
                    updateValues.push(tipo);
                }

                if (Object.keys(updateFields).length > 0) {
                    const setClause = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
                    updateValues.push(promocionId);

                    await connection.promise().query(
                        `UPDATE promocion SET ${setClause} WHERE idpromocion = ?`,
                        updateValues
                    );
                }


                if (imagenes_a_eliminar && imagenes_a_eliminar.length > 0) {

                    const deletePromises = imagenes_a_eliminar.map(async (public_id) => {
                        try {

                            await cloudinary.uploader.destroy(public_id);


                            await connection.promise().query(
                                'DELETE FROM imagen WHERE public_id = ? AND promocion_idpromocion = ?',
                                [public_id, promocionId]
                            );
                        } catch (error) {
                            console.error(`Error al eliminar imagen ${public_id}:`, error);

                        }
                    });

                    await Promise.all(deletePromises);
                }


                if (req.files && req.files.length > 0) {
                    const uploadPromises = req.files.map((file) => {
                        return new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream(
                                {
                                    resource_type: "image",
                                    format: "webp",
                                    transformation: { width: 600, height: 450, crop: "limit" }
                                },
                                (error, result) => {
                                    if (error) {
                                        reject(error);
                                    } else {
                                        resolve(result);
                                    }
                                }
                            );
                            uploadStream.end(file.buffer);
                        });
                    });

                    const imageResults = await Promise.all(uploadPromises);

                    const insertPromises = imageResults.map((image) => {
                        return connection.promise().query(
                            "INSERT INTO imagen (url, public_id, promocion_idpromocion) VALUES (?, ?, ?)",
                            [image.secure_url, image.public_id, promocionId]
                        );
                    });

                    await Promise.all(insertPromises);
                }

                res.status(200).json({ message: 'Promoción actualizada exitosamente', promocionId });
            } catch (error) {
                console.error('Error al actualizar promoción:', error);
                res.status(500).json({ message: 'Error al actualizar promoción' });
            }
        },

        eliminarPromocion: async (req, res) => {
            const { id } = req.params;

            try {

                const [result] = await connection.promise().query(
                    'UPDATE promocion SET eliminado = ? WHERE idpromocion = ?',
                    [1, id]
                );

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Promoción no encontrada' });
                }

                res.status(200).json({ message: 'Promoción eliminada lógicamente' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ message: 'Error' });
            }
        },
        promocionGeneral: async (req, res) => {
            const {
                matriz_idmatriz,
                categoria_idcategoria,
                nombre,
                descripcion,
                precio,
                vigenciainicio,
                vigenciafin,
                tipo,
            } = req.body;

            try {

                const [matrizResult] = await connection.promise().query(
                    'SELECT idmatriz FROM matriz WHERE idmatriz = ?',
                    [matriz_idmatriz]
                );
                if (matrizResult.length === 0) {
                    return res.status(400).json({ message: 'La matriz especificada no existe' });
                }


                const [empresasResult] = await connection.promise().query(
                    'SELECT idempresa FROM empresa WHERE matriz_idmatriz = ?',
                    [matriz_idmatriz]
                );

                if (empresasResult.length === 0) {
                    return res.status(400).json({ message: 'No hay empresas asociadas a la matriz especificada' });
                }


                let imageResults = [];
                if (req.files && req.files.length > 0) {
                    const uploadPromises = req.files.map((file) => {
                        return new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream(
                                {
                                    resource_type: "image",
                                    format: "webp",
                                    transformation: { width: 600, height: 450, crop: "limit" }

                                },
                                (error, result) => {
                                    if (error) {
                                        reject(error);
                                    } else {
                                        resolve(result);
                                    }
                                }
                            );
                            uploadStream.end(file.buffer);
                        });
                    });

                    imageResults = await Promise.all(uploadPromises);
                }


                const insertPromises = empresasResult.map(async (empresa) => {

                    const [result] = await connection.promise().query(
                        'INSERT INTO promocion (empresa_idempresa, categoria_idcategoria, nombre, descripcion, precio, vigenciainicio, vigenciafin, tipo, eliminado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [empresa.idempresa, categoria_idcategoria, nombre, descripcion, precio, vigenciainicio, vigenciafin, tipo, 0]
                    );

                    const promocionId = result.insertId;


                    if (imageResults.length > 0) {
                        const imageInsertPromises = imageResults.map((image) => {
                            return connection.promise().query(
                                "INSERT INTO imagen (url, public_id, promocion_idpromocion) VALUES (?, ?, ?)",
                                [image.secure_url, image.public_id, promocionId]
                            );
                        });
                        await Promise.all(imageInsertPromises);
                    }

                    return promocionId;
                });

                const promocionesCreadas = await Promise.all(insertPromises);

                res.status(201).json({
                    message: 'Promociones generales creadas con imágenes para todas las empresas de la matriz',
                    promocionesCreadas,
                });
            } catch (error) {
                console.error('Error al crear promociones generales:', error);
                res.status(500).json({ message: 'Error al crear promociones generales' });
            }
        },consultarPorRango: async (req, res) => {
            const { lat, lng, rango } = req.body;
            try {
               const [promociones] = await connection.promise().query(
    `SELECT
        p.idpromocion,
        p.empresa_idempresa,
        p.categoria_idcategoria,
        p.nombre AS promocion_nombre,
        p.descripcion AS promocion_descripcion,
        p.precio,
        p.vigenciainicio,
        p.vigenciafin,
        p.tipo,
        e.nombre AS empresa_nombre,
        e.descripcion AS empresa_descripcion
    FROM promocion AS p
    INNER JOIN empresa AS e ON p.empresa_idempresa = e.idempresa
    WHERE (
        6371000 * acos(
            cos(radians(?)) * cos(radians(ST_Y(e.ubicacion))) *
            cos(radians(ST_X(e.ubicacion)) - radians(?)) +
            sin(radians(?)) * sin(radians(ST_Y(e.ubicacion)))
        )
    ) <= ? AND p.eliminado = 0`,
    [parseFloat(lat), parseFloat(lng), parseFloat(lat), rango]
);

                if (promociones.length === 0) {
                    return res.status(404).json({ message: 'No se encontraron promociones en el rango especificado' });
                }

                const promocionesConImagenes = await Promise.all(
                    promociones.map(async (promocion) => {
                        const [imagenes] = await connection.promise().query(
                            'SELECT idimagen, url, public_id FROM imagen WHERE promocion_idpromocion = ?',
                            [promocion.idpromocion]
                        );
                        return {
                            ...promocion,
                            imagenes: imagenes.map(img => ({
                                id: img.idimagen,
                                url: img.url,
                                public_id: img.public_id
                            }))
                        };
                    })
                );

                res.status(200).json(promocionesConImagenes);
            } catch (error) {
                console.error('Error al consultar promociones por rango:', error);
                res.status(500).json({ message: 'Error al consultar promociones' });
            }
        }





    };
};