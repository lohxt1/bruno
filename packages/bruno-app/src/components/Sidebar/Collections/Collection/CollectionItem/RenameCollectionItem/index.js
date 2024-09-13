import React, { useRef, useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Modal from 'components/Modal';
import { useDispatch } from 'react-redux';
import { isItemAFolder } from 'utils/tabs';
import { renameItem, renameItemName, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import { normalizeFileName } from 'utils/common/index';
import path from 'path';
import { IconEdit, IconFile } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';

const RenameCollectionItem = ({ collection, item, onClose }) => {
  const dispatch = useDispatch();
  const isFolder = isItemAFolder(item);
  const inputRef = useRef();
  const [isEditingFilename, toggleEditingFilename] = useState(false);
  const itemName = item?.name;
  const itemType = item?.type;
  const itemFilename = item?.filename ? path.parse(item?.filename).name : '';
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: itemName,
      filename: itemFilename
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(1, 'must be at least 1 character')
        .max(50, 'must be 50 characters or less')
        .required('name is required'),
      filename: Yup.string()
        .min(1, 'must be at least 1 character')
        .max(50, 'must be 50 characters or less')
        .required('name is required')
        .test({
          name: 'filename',
          message: `The file names - collection and folder is reserved in bruno`,
          test: (value) => {
            const trimmedValue = value ? value.trim().toLowerCase() : '';
            return !['collection', 'folder'].includes(trimmedValue);
          }
        })
        .test({
          name: 'filename',
          message: `Invalid file name`,
          test: (value) => {
            const trimmedValue = value ? value.trim().toLowerCase() : '';
            return (normalizeFileName(trimmedValue) === trimmedValue)
          }
        })
    }),
    onSubmit: async (values) => {
      // if there is unsaved changes in the request,
      // save them before renaming the request
      if (!isFolder && item.draft) {
        await dispatch(saveRequest(item.uid, collection.uid, true));
      }
      if (values.name !== itemName) {
        await dispatch(renameItemName(values.name, item.uid, collection.uid))
      }
      if (values.filename !== itemFilename) {
        await dispatch(renameItem(values.name, values.filename, item.uid, collection.uid));
      }
      onClose();
    }
  });

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const onSubmit = () => formik.handleSubmit();

  const filename = formik.values.filename;
  const filenameFooter = !isEditingFilename && filename ?
    <div className='flex flex-row gap-2 items-center w-full h-full'>
      <p className='cursor-default opacity-50 whitespace-nowrap overflow-hidden text-ellipsis max-w-64' title={filename}>{filename}.bru</p>
      <IconEdit className="cursor-pointer opacity-50 hover:opacity-80" size={20} strokeWidth={1.5} onClick={() => toggleEditingFilename(v => !v)} />
    </div>
    :
    <></>

  return (
    <Modal
      size="md"
      title={`Rename ${isFolder ? 'Folder' : 'Request'}`}
      confirmText="Rename"
      handleConfirm={onSubmit}
      handleCancel={onClose}
      customFooter={filenameFooter}
    >
      <StyledWrapper>
        <form className="bruno-form" onSubmit={formik.handleSubmit}>
          <div className='flex flex-col mt-2'>
            <label htmlFor="name" className="block font-semibold">
              {isFolder ? 'Folder' : 'Request'} Name
            </label>
            <input
              id="collection-item-name"
              type="text"
              name="name"
              ref={inputRef}
              className="block textbox mt-2 w-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={e => {
                formik.setFieldValue('name', e.target.value);
                !isEditingFilename && formik.setFieldValue('filename', normalizeFileName(e.target.value));
              }}
              value={formik.values.name || ''}
            />
            {formik.touched.name && formik.errors.name ? <div className="text-red-500">{formik.errors.name}</div> : null}
          </div>
          {
            isEditingFilename ?
              <div className="mt-4">
                <label htmlFor="filename" className="block font-semibold">
                  {isFolder ? 'Directory' : 'File'} Name
                </label>
                <div className='relative flex flex-row gap-1 items-center justify-between'>
                  <input
                    id="file-name"
                    type="text"
                    name="filename"
                    placeholder="File Name"
                    className={`!pr-10 block textbox mt-2 w-full`}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    onChange={formik.handleChange}
                    value={formik.values.filename || ''}
                  />
                  {itemType !== 'folder' && <span className='absolute right-2 top-4 flex justify-center items-center file-extension'>.bru</span>}
                </div>
                {formik.touched.filename && formik.errors.filename ? (
                  <div className="text-red-500">{formik.errors.filename}</div>
                ) : null}
              </div>
              :
              <></>
          }
        </form>
      </StyledWrapper>
    </Modal>
  );
};

export default RenameCollectionItem;
