'use client';

import { useState } from 'react';
import { AiOutlineLock, AiOutlineUnlock } from "react-icons/ai";

const LockButton = ({ isLocked, toggleLock }) => {
  return (
    <button onClick={toggleLock} style={{ position: 'fixed', top: 20, right: 20 }}>
      {isLocked ? <AiOutlineUnlock size={24} /> : <AiOutlineLock size={24} />}
      {isLocked ? 'Unlock Meeting' : 'Lock Meeting'}
    </button>
  );
};

export default LockButton;
