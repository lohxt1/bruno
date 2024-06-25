import React from 'react';
import { uuid } from 'utils/common';
import { IconFiles, IconRun, IconEye, IconSettings, IconShieldLock } from '@tabler/icons';
import EnvironmentSelector from 'components/Environments/EnvironmentSelector';
import { addTab } from 'providers/ReduxStore/slices/tabs';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';

const CollectionToolBar = ({ collection }) => {
  const dispatch = useDispatch();

  const handleRun = () => {
    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: collection.uid,
        type: 'collection-runner'
      })
    );
  };

  const viewVariables = () => {
    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: collection.uid,
        type: 'variables'
      })
    );
  };

  const viewCollectionSettings = () => {
    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: collection.uid,
        type: 'collection-settings'
      })
    );
  };

  const viewSecuritySettings = () => {
    dispatch(
      addTab({
        uid: uuid(),
        collectionUid: collection.uid,
        type: 'security-settings'
      })
    );
  };

  return (
    <StyledWrapper>
      <div className="flex items-center p-2">
        <div className="flex flex-1 items-center cursor-pointer hover:underline" onClick={viewCollectionSettings}>
          <IconFiles size={18} strokeWidth={1.5} />
          <span className="ml-2 mr-4 font-semibold">{collection.name}</span>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <button className="btn btn-sm border border-slate-500/70 mr-2 opacity-30">Enable Code Execution</button>
          <span className="mr-2">
            <IconShieldLock className="cursor-pointer" size={20} strokeWidth={1.5} onClick={viewSecuritySettings} />
          </span>
          <span className="mr-2">
            <IconRun className="cursor-pointer" size={20} strokeWidth={1.5} onClick={handleRun} />
          </span>
          <span className="mr-3">
            <IconEye className="cursor-pointer" size={18} strokeWidth={1.5} onClick={viewVariables} />
          </span>
          <span className="mr-3">
            <IconSettings className="cursor-pointer" size={18} strokeWidth={1.5} onClick={viewCollectionSettings} />
          </span>
          <EnvironmentSelector collection={collection} />
        </div>
      </div>
    </StyledWrapper>
  );
};

export default CollectionToolBar;
