import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import React, { ReactElement, useState } from 'react';
import { useSession, signOut } from 'next-auth/react'; 
import { encodePassphrase, generateRoomId, randomString } from '../lib/client-utils';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import { getSession } from 'next-auth/react';
import { BiExit, BiExitFullscreen } from 'react-icons/bi';

interface TabsProps {
  children: ReactElement[];
  selectedIndex?: number;
  onTabSelected?: (index: number) => void;
}

function Tabs(props: TabsProps) {
  const activeIndex = props.selectedIndex ?? 0;
  if (!props.children) {
    return <></>;
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <button
        className="lk-button"
        onClick={() => {
          if (props.onTabSelected) props.onTabSelected(index);
        }}
        aria-pressed={activeIndex === index}
      >
        {child?.props.label}
      </button>
    );
  });
  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabSelect}>{tabs}</div>
      {props.children[activeIndex]}
    </div>
  );
}

function DemoMeetingTab({ label }: { label: string }) {
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
  const { data: session } = useSession(); 
  
  const startMeeting = async () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }

    const roomId = generateRoomId();
    const roomLink = e2ee
      ? `/rooms/${roomId}#${encodePassphrase(sharedPassphrase)}`
      : `/rooms/${roomId}`;
    const lock_status = false;
    try {
      const response = await fetch('./api/saveRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId, lock_status }),
      });
      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`Failed to save room details: ${errorDetails.details}`);
      }
      router.push(roomLink);
    } catch (error) {
      console.error('Error starting the meeting:', error);
    }
  };

  return (
    <div className={styles.tabContent}>
      <p style={{ margin: 0 }}>Try LiveKit Meet for free with our live demo project.</p>
      <button style={{ marginTop: '1rem' }} className="lk-button" onClick={startMeeting}>
        Start Meeting
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CustomConnectionTab({ label }: { label: string }) {
  const router = useRouter();

  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const serverUrl = formData.get('serverUrl');
    const token = formData.get('token');
    if (e2ee) {
      router.push(
        `/custom/?liveKitUrl=${serverUrl}&token=${token}#${encodePassphrase(sharedPassphrase)}`,
      );
    } else {
      router.push(`/custom/?liveKitUrl=${serverUrl}&token=${token}`);
    }
  };
  return (
    <form className={styles.tabContent} onSubmit={onSubmit}>
      <p style={{ marginTop: 0 }}>
        Connect LiveKit Meet with a custom server using LiveKit Cloud or LiveKit Server.
      </p>
      <input
        id="serverUrl"
        name="serverUrl"
        type="url"
        placeholder="LiveKit Server URL: wss://*.livekit.cloud"
        required
      />
      <textarea
        id="token"
        name="token"
        placeholder="Token"
        required
        rows={5}
        style={{ padding: '1px 2px', fontSize: 'inherit', lineHeight: 'inherit' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>

      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
      />
      <button
        style={{ paddingInline: '1.25rem', width: '100%' }}
        className="lk-button"
        type="submit"
      >
        Connect
      </button>
    </form>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  return {
    props: {
      session,
    },
  };
};

const Home = ({ tabIndex }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { data: session } = useSession(); 

  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : 'demo';
    router.push({ query: { tab } });
  }

  return (
    <>
      <div className="flex items-center justify-end font-semibold text-lg space-x-4 p-5">
        {session ? (
          <div className="flex items-center space-x-5">
            <div className="text-white">
              {session.user.email} - {session.user.role}
            </div>
            {session.user.role === 'admin' && (
              <Link href="/auth/createuser">
                <button className='border border-black rounded-2xl p-1 bg-[#ff6352] text-black hover:bg-white hover:text-black duration-500'>
                  Create New User
                </button>
              </Link>
            )}
            <BiExit onClick={() => signOut()} className='text-2xl cursor-pointer'/>
          </div>
        ) : (
          <>
            <Link href="/auth/login" className='border font-bold border-black rounded-2xl p-1 bg-[#ff6352] text-black hover:bg-white hover:text-black duration-500'>Login</Link>
            <Link href="/auth/signup" className='border font-bold border-black rounded-2xl p-1 bg-[#ff6352] text-black hover:bg-white hover:text-black duration-500'>SignUp</Link>
          </>
        )}
      </div>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <img src="/images/livekit-meet-home.svg" alt="LiveKit Meet" width="360" height="45" />
          <h2>
            Open source video conferencing app built on{' '}
            <a href="https://github.com/livekit/components-js?ref=meet" rel="noopener">
              LiveKit&nbsp;Components
            </a>
            ,{' '}
            <a href="https://livekit.io/cloud?ref=meet" rel="noopener">
              LiveKit&nbsp;Cloud
            </a>{' '}
            and Next.js.
          </h2>
        </div>
        <Tabs selectedIndex={tabIndex ?? 0} onTabSelected={onTabSelected}>
          <DemoMeetingTab label="Demo Meeting" />
          <CustomConnectionTab label="Custom Connection" />
        </Tabs>
      </main>
    </>
  );
};

export default Home;
