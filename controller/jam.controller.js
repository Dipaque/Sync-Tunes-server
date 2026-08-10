import admin from 'firebase-admin';

// Fetch rooms where the logged-in user is the admin
const getMyRooms = async (req, res) => {
  try {
    const db = admin.firestore();
    // Get email from req.body as requested
    const { email } = req.body; 

    if (!email) {
      return res.status(400).json({ error: "Email is required to fetch rooms" });
    }

    // Query Firestore where the admin object's email matches
    const roomsSnapshot = await db.collection('room')
                                  .where('adminEmail', '==', email)
                                  .get();

    const myRooms = roomsSnapshot.docs.map(doc => ({
      roomId: doc.id,
      ...doc.data()
    }));

    res.status(200).json(myRooms);
  } catch (error) {
    console.error("Get My Rooms Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export { getMyRooms };