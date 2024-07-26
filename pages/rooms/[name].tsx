import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
  useToken,
  LocalUserChoices,
  PreJoin,
} from '@livekit/components-react';

import {
  DeviceUnsupportedError,
  ExternalE2EEKeyProvider,
  Room,
  RoomConnectOptions,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  setLogLevel,
} from 'livekit-client';

import Head from 'next/head';
import * as React from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { DebugMode } from '../../lib/Debug';
import { useSession } from 'next-auth/react';
import { SettingsMenu } from '../../lib/SettingsMenu';
import FullScreenWhiteboard from '../components/FullScreenWhiteboard';
import { decodePassphrase, useServerUrl } from '../../lib/client-utils';

const Home: NextPage = () => {
  const router = useRouter();
  const { name: roomName } = router.query;
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  const [isLocked, setIsLocked] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);
  
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);

  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    try {
      const response = await fetch('../api/getLockStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomName }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lock status');
      }

      const data = await response.json();
      if (data.lockStatus) {
        setIsLocked(true);
        return;
      }

      setPreJoinChoices(values);
    } catch (error) {
      console.error('Error fetching lock status:', error);
    }
  }, [roomName]);
  

  const onPreJoinError = React.useCallback((e: any) => {
    console.error(e);
  }, []);

  const onLeave = React.useCallback(() => router.push('/'), []);
  
  
  if (isLocked) {
    alert('This meeting is currently locked. Please try again later.');
  }
  return (
    <>
      <Head>
        <title>LiveKit Meet</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main data-lk-theme="default">
        {roomName && !Array.isArray(roomName) && preJoinChoices ? (
          <ActiveRoom
            roomName={roomName}
            userChoices={preJoinChoices}
            onLeave={onLeave}
          />
        ) : (
          <div className='grid items-center h-[100%]'>
            <PreJoin
              onError={onPreJoinError}
              defaults={preJoinDefaults}
              onSubmit={handlePreJoinSubmit}
            />
          </div>
        )}
      </main>
             
    
    </>
  );
};

export default Home;

type ActiveRoomProps = {
  userChoices: LocalUserChoices;
  roomName: string;
  region?: string;
  onLeave?: () => void;
};

const ActiveRoom = ({ roomName, userChoices, onLeave }: ActiveRoomProps) => {
  const [isLocked, setIsLocked] = useState(false);
  const [roomExists, setRoomExists] = useState(true); 
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); 
  const [users, setUsers] = useState<{ admin: string[], member: string[], monitor: string[] }>({ admin: [], member: [], monitor: [] }); 
  
  const { data: session } = useSession(); 
  const userEmail = session?.user?.email; 

  const fetchLockStatus = async () => {
    try {
      const response = await fetch('../api/getLockStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomName }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lock status');
      }

      const data = await response.json();
      setIsLocked(data.lockStatus);
      setRoomExists(true); 
    } catch (error) {
      console.error('Error fetching lock status:', error);
      setRoomExists(false); 
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('../api/getUsers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomName }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers({
        admin: data.admin || [],
        member: data.member || [],
        monitor: data.monitor || [],
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (!userEmail) return;

    const addUserToRoom = async () => {
      await fetch('../api/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomName, email: userEmail, role: session.user.role }), 
      });
    };

    addUserToRoom();

    return () => {
      const removeUserFromRoom = async () => {
        await fetch('../api/removeUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ roomId: roomName, email: userEmail, role: session.user.role }), 
        });
      };

      removeUserFromRoom();
    };
  }, [userEmail, roomName, session?.user.role]);

  useEffect(() => {
    fetchLockStatus(); 
    fetchUsers(); 
    const lockStatusIntervalId = setInterval(fetchLockStatus, 10000);
    const usersIntervalId = setInterval(fetchUsers, 10000);
    return () => {
      clearInterval(lockStatusIntervalId);
      clearInterval(usersIntervalId);
    };
  }, [session]);
  
 

 

  const toggleLock = async () => {
    try {
      const response = await fetch('../api/toggleLock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomName, lock_status: !isLocked }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lock status');
      }

      const data = await response.json();
      setIsLocked(data.lockStatus);
    } catch (error) {
      console.error('Error updating lock status:', error);
    }
  };


  const handleSidebarToggle = () => {
    setShowSidebar((prev) => !prev);
  };

  

  const tokenOptions = React.useMemo(() => {
    return {
      userInfo: {
        identity: userChoices.username,
        name: userChoices.username,
      },
    };
  }, [userChoices.username]);
  const token = useToken(process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT, roomName, tokenOptions);

  const router = useRouter();
  const { region, hq, codec } = router.query;

  const e2eePassphrase =
    typeof window !== 'undefined' && decodePassphrase(location.hash.substring(1));

  const liveKitUrl = useServerUrl(region as string | undefined);

  const worker =
    typeof window !== 'undefined' &&
    e2eePassphrase &&
    new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));

  const e2eeEnabled = !!(e2eePassphrase && worker);
  const keyProvider = new ExternalE2EEKeyProvider();
  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = (
      Array.isArray(codec) ? codec[0] : codec ?? 'vp9'
    ) as VideoCodec;
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    return {
      videoCaptureDefaults: {
        deviceId: userChoices.videoDeviceId ?? undefined,
        resolution: hq === 'true' ? VideoPresets.h2160 : VideoPresets.h720,
      },
      publishDefaults: {
        dtx: false,
        videoSimulcastLayers:
          hq === 'true'
            ? [VideoPresets.h1080, VideoPresets.h720]
            : [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec,
      },
      audioCaptureDefaults: {
        deviceId: userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
    // @ts-ignore
    setLogLevel('debug', 'lk-e2ee');
  }, [userChoices, hq, codec]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  if (e2eeEnabled) {
    keyProvider.setKey(decodePassphrase(e2eePassphrase));
    room.setE2EEEnabled(true).catch((e) => {
      if (e instanceof DeviceUnsupportedError) {
        alert(
          `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
        );
        console.error(e);
      }
    });
  }
  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  if (!roomExists) {
    alert('Room not found or error fetching room status.');
  }

  return (
    <>
      {liveKitUrl && (
        <LiveKitRoom
          room={room}
          token={token}
          serverUrl={liveKitUrl}
          connectOptions={connectOptions}
          video={userChoices.videoEnabled}
          audio={userChoices.audioEnabled}
          onDisconnected={onLeave}
        >
          {showWhiteboard ? (
            <div className='bg-white'>
              <p className='text-black font-bold text-xl flex justify-center items-center'>Whiteboard Placeholder</p>
              <FullScreenWhiteboard/>
            </div>
          ) : (
            <VideoConference
              chatMessageFormatter={formatChatMessageLinks}
              SettingsComponent={
                process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true' ? SettingsMenu : undefined
              }
            />
          )}
          <div className="controls flex">
            <div>
              <button type="button" onClick={() => setShowWhiteboard(!showWhiteboard)} className="bg-[#1e1e1e] text-white items-center inline-flex text-[16px] cursor-pointer rounded-lg hover:bg-[#303032] p-2">
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="25" height="25" viewBox="0 0 50 50">
                  <path fill='white' d="M 39.501953 5.3769531 C 39.374314 5.3804379 39.247388 5.3965646 39.123047 5.4238281 C 38.625051 5.5330207 38.168098 5.8287445 37.873047 6.2832031 L 34.806641 11 L 6 11 C 4.3545455 11 3 12.354545 3 14 L 3 41 C 3 42.645455 4.3545455 44 6 44 L 44 44 C 45.645455 44 47 42.645455 47 41 L 47 14 C 47 12.354545 45.645455 11 44 11 L 43.916016 11 L 44.308594 10.380859 C 44.894832 9.45595 44.612206 8.2032695 43.6875 7.6191406 L 40.619141 5.6816406 L 40.617188 5.6816406 C 40.274027 5.4652303 39.884871 5.3664989 39.501953 5.3769531 z M 39.550781 7.3730469 L 42.619141 9.3105469 L 41.330078 11.345703 A 1.0001 1.0001 0 0 0 41.171875 11.59375 L 34.175781 22.640625 L 30.902344 20.675781 L 36.113281 12.660156 A 1.0001 1.0001 0 0 0 36.271484 12.417969 L 39.550781 7.3730469 z M 6 13 L 33.507812 13 L 28.75 20.320312 A 1.0001 1.0001 0 0 0 28.490234 21.066406 A 1.0001 1.0001 0 0 0 28.490234 21.070312 L 27.998047 26.916016 A 1.0001 1.0001 0 0 0 28.177734 27.578125 C 27.514688 28.170014 26.469292 29 24.441406 29 C 20.388406 29 19.457453 21 13.314453 21 C 9.4944531 21 7.25 24.478 7.25 25.5 C 7.25 25.72 7.3099531 26 7.7519531 26 C 8.4229531 26 9.6426875 24 12.304688 24 C 17.272688 24 17.365641 32 23.431641 32 C 26.407457 32 28.675024 29.309805 29.306641 27.949219 A 1.0001 1.0001 0 0 0 29.472656 27.878906 L 34.847656 24.951172 L 34.851562 24.949219 A 1.0001 1.0001 0 0 0 35.431641 24.400391 L 42.650391 13 L 44 13 C 44.554545 13 45 13.445455 45 14 L 45 41 C 45 41.554545 44.554545 42 44 42 L 6 42 C 5.4454545 42 5 41.554545 5 41 L 5 14 C 5 13.445455 5.4454545 13 6 13 z M 30.361328 22.681641 L 32.486328 23.957031 L 30.146484 25.232422 L 30.361328 22.681641 z"></path>
                </svg>
                <span className="hidden md:inline-block ml-2">
                  {showWhiteboard ? 'Back to Conference' : 'Whiteboard'}
                </span>
              </button>
            </div>
            <div>
            {session?.user?.role === 'admin' && (
              <button className="items-center justify-center bg-[#1e1e1e] text-white inline-flex text-[16px] cursor-pointer rounded-lg hover:bg-[#303032] top-0 bottom-0 left-0 right-0" onClick={handleSidebarToggle}>
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="40" height="40" viewBox="0 0 50 50">
                  <path fill="white" d="m21.9 20.65-1.18-4a5 5 0 0 0-4.84-3.55h-.46A6.1 6.1 0 0 0 18.05 8a5.78 5.78 0 0 0-5.53-6A5.79 5.79 0 0 0 7 8a6.11 6.11 0 0 0 2.64 5.1h-.47a5 5 0 0 0-4.84 3.55l-1.19 4a1.09 1.09 0 0 0 .59 1.29 25.39 25.39 0 0 0 8.79 2h.05a25.47 25.47 0 0 0 8.74-2 1.08 1.08 0 0 0 .59-1.29zm-9.48-5.88-.81-.7h1.62zm2.33-.7h1l-1.36 2.62-1.27-1.18zM12.52 3a4.55 4.55 0 0 1 4.18 3.05 3.76 3.76 0 0 1-1.38 0 3.89 3.89 0 0 1-1.7-.89.51.51 0 0 0-.65 0 5.23 5.23 0 0 1-4.64 1A4.56 4.56 0 0 1 12.52 3zM8 8a5.64 5.64 0 0 1 .07-1 6.6 6.6 0 0 0 1.64.21 5.92 5.92 0 0 0 1.8-.21 6.09 6.09 0 0 0 1.76-.85 4.63 4.63 0 0 0 1.82.85A4.58 4.58 0 0 0 17 7a5.64 5.64 0 0 1 .08.93 4.78 4.78 0 0 1-4.53 5A4.79 4.79 0 0 1 8 8zm2.11 6.1 1.68 1.46-1.16 1.15-1.49-2.64h.95zm-6 6.86 1.19-4a4 4 0 0 1 2.79-2.68l2 3.53a.57.57 0 0 0 .37.25h.07a.47.47 0 0 0 .35-.15L12 16.7l.05 6.2A24.73 24.73 0 0 1 4.16 21s-.08 0-.06-.07zm16.78.04a25.55 25.55 0 0 1-7.83 1.86L13 16.8l1.15 1.07a.53.53 0 0 0 .34.13h.09a.47.47 0 0 0 .35-.26l1.85-3.55a4 4 0 0 1 3 2.72l1.18 4a.09.09 0 0 1-.07.09z" />
                </svg>
                <span className="hidden md:inline ml-2">
                  {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
                </span>
              </button>
            )}
            </div>
          </div>
          <DebugMode />
          {session?.user?.role === 'admin' && (
          <button type='button' className="lk-button absolute top-[10px] right-[10px]" onClick={toggleLock}>
            {isLocked ? '🔒' : '🔓'}
          </button>
          )}
          <div className='flex flex-col'>
          <div className="absolute top-[50px] right-[10px]">
            {isLocked ? 'Room is locked' : 'Room is unlocked'}
          </div>
          <div className="absolute top-[100px] right-[10px]">  
          {showSidebar && (
            <div className="bg-black border rounded-lg p-2">
              <h2 className='text-xl font-bold justify-center items-center'>Participants</h2>
              <div className='gap-4'>
                <h3 className='text-lg font-bold'>Admins</h3>
                <ul>
                  {users.admin.map((admin) => (
                    <li key={admin}>{admin}</li>
                  ))}
                </ul>
                <h3 className='text-lg font-bold'>Members</h3>
                <ul>
                  {users.member.map((member) => (
                    <li key={member}>{member}</li>
                  ))}
                </ul>
                <h3 className='text-lg font-bold'>Monitors</h3>
                <ul>
                  {users.monitor.map((monitor) => (
                    <li key={monitor}>{monitor}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          </div>
          </div>
        </LiveKitRoom>
      )}
    </>
  );
};
