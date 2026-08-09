import redisClient from "../redis"

/**
 * Publish the new song to the room
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
const publishRoom = async(req, res) => {
    try{
        const {room, id, artist, image, playedBy } = req.body;

        const client = redisClient.client;
        
        const response =  await client.publish(room, {
            id,
            artist,
            image,
            playedBy
        })

        res.status(200).send({message:"Song published successfully", response})
    }catch(err){
        console.log(err);
        res.status(500).send({err})
    }
}

export {
    publishRoom
}