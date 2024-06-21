import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, where, getDocs, } from 'firebase/firestore';
import firebase from '../../firebase';

const RoomPage = () => {
  const router = useRouter();
  const { name } = router.query;
  const [roomData, setRoomData] = useState(null);
  const [user, setUser] = useState(null);
  const [accessRequests, setAccessRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState('');

  useEffect(() => {
    const auth = getAuth(firebase);
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const db = getFirestore(firebase);
        const roomDocRef = doc(db, 'meetings', name);
        const roomDocSnap = await getDoc(roomDocRef);
        if (roomDocSnap.exists()) {
          setRoomData(roomDocSnap.data());

          const accessRequestsRef = collection(db, 'meetings', name, 'accessRequests');
          const accessRequestsSnapshot = await getDocs(accessRequestsRef);
          const accessRequestsList = accessRequestsSnapshot.docs.map(doc => doc.data());
          setAccessRequests(accessRequestsList);

          if (user) {
            const userRequest = accessRequestsList.find(req => req.userId === user.uid);
            if (userRequest) {
              setRequestStatus(userRequest.status);
            }
          }

        } else {
          console.log('Room not found');
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
      }
    };

    if (name && user) {
      fetchRoomData();
    }
  }, [name, user]);

  const requestAccess = async () => {
    if (user && roomData?.owner !== user.uid) {
      try {
        const db = getFirestore(firebase);
        const requestsRef = collection(db, `meetings/${name}/accessRequests`);
        const newRequest = {
          userId: user.uid,
          status: 'pending',
        };
        await addDoc(requestsRef, newRequest);

        const ownerUid = roomData.owner;
        const notificationsRef = doc(db, 'notifications', ownerUid);
        const notification = {
          message: `${user.displayName} (${user.email}) requested access to room ${name}`,
          timestamp: new Date(),
        };
        await updateDoc(notificationsRef, {
          notifications: arrayUnion(notification),
        });

        console.log('Access request sent.');
        setRequestStatus('pending');
      } catch (error) {
        console.error('Error sending access request:', error);
      }
    }
  };

  const renderOwnerUI = () => (
    <div>
      <h1>Welcome, Owner!</h1>
      {accessRequests.length > 0 && (
        <div>
          <h2>Access Requests</h2>
          <ul>
            {accessRequests.map((request) => (
              <li key={request.userId}>
                Request from user ID: {request.userId}
                <button onClick={() => handleApprove(request.userId)}>Approve</button>
                <button onClick={() => handleDeny(request.userId)}>Deny</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const handleApprove = async (userId) => {
    try {
      const db = getFirestore(firebase);
      const requestsRef = collection(db, `meetings/${name}/accessRequests`);
      const requestQuery = query(requestsRef, where('userId', '==', userId));
      const requestSnapshot = await getDocs(requestQuery);
      const requestDoc = requestSnapshot.docs[0];
      await updateDoc(requestDoc.ref, { status: 'approved' });

      console.log(`Access approved for user ID ${userId}`);
    } catch (error) {
      console.error('Error approving access request:', error);
    }
  };

  const handleDeny = async (userId) => {
    try {
      const db = getFirestore(firebase);
      const requestsRef = collection(db, `meetings/${name}/accessRequests`);
      const requestQuery = query(requestsRef, where('userId', '==', userId));
      const requestSnapshot = await getDocs(requestQuery);
      const requestDoc = requestSnapshot.docs[0];
      await updateDoc(requestDoc.ref, { status: 'denied' });

      console.log(`Access denied for user ID ${userId}`);
    } catch (error) {
      console.error('Error denying access request:', error);
    }
  };

  const renderUserUI = () => (
    <div>
      {requestStatus === 'approved' ? (
        <h1>Welcome to the Room!</h1>
      ) : (
        <>
          <h1>Waiting for Approval...</h1>
          {requestStatus !== 'pending' && <button onClick={requestAccess}>Request Access</button>}
        </>
      )}
    </div>
  );

  return (
    <div>
      {user && roomData?.owner === user.uid ? renderOwnerUI() : renderUserUI()}
    </div>
  );
};

export default RoomPage;