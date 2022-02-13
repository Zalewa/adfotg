import { useEffect, useState } from 'react';
import Dropzone from 'react-dropzone';
import * as request from 'superagent';

import { Notification, Note, NoteType,
	dispatchRequestError } from '../component/Notifier';
import { Loader } from '../ui/ui';
import * as skin from '../skin';

const MyDropzone = (props : {
	onUploading: () => void,
	onUploadDone: (err: Error) => void,
}) => {
	const onDrop = (accepted: File[]) => {
		props.onUploading();
		const req = request.post("/api/upload");
		accepted.forEach(file => req.attach(file.name, file));
		req.end((err, res) => props.onUploadDone(err));
	}

	return (<Dropzone onDropAccepted={onDrop}>
		{({getRootProps, getInputProps, isDragAccept, isDragReject}) => {
			return (<div {...getRootProps()}>
				<input {...getInputProps()} />
				<p css={[
					{
						cursor: "pointer",
						padding: "1em 4em",
						border: `0.25em dashed ${skin.page.color}`,
						borderRadius: "0.5em",
						margin: "auto",
						textAlign: "center",
						verticalAlign: "middle",
						"&:hover": {
							backgroundColor: skin.workbench.titleColor,
						}
					},
					isDragAccept && { backgroundColor: skin.workbench.titleColor },
					isDragReject && { backgroundColor: skin.dangerColor },
				]}>
					Drag & drop or click to select files to upload.
				</p>
			</div>);
		}}
	</Dropzone>);
}

const UploadDone = (props: {success: boolean}) => {
	const note: Note = props.success ?
		{ type: NoteType.Success, message: "UPLOAD DONE !" } :
		{ type: NoteType.Error, message: "UPLOAD FAILED !" };
	return <Notification note={note} css={{ fontSize: "2em", textAlign: "center" }} />;
}

interface UploadProps {
	onUpload: () => void;
}

export default (props: UploadProps) => {
	const [ uploading, setUploading ] = useState(false);
	const [ uploadSuccess, setUploadSuccess ] = useState(null);

	useEffect(() => {
		let timer: NodeJS.Timeout = null;
		if (uploadSuccess !== null) {
			timer = setTimeout(() => setUploadSuccess(null), 2000);
			return () => clearTimeout(timer);
		} else {
			clearTimeout(timer);
		}
	}, [uploadSuccess]);

	return (<div css={{padding: "0 2em 1em 2em"}}>
		<div css={{width: "100%"}}>
			{!uploading && uploadSuccess === null && <MyDropzone
				onUploading={() => setUploading(true)}
				onUploadDone={(err: Error) => {
					setUploading(false);
					setUploadSuccess(!err);
					dispatchRequestError(err);
					if (!err)
						props.onUpload();
				} } />}
			{uploading && <Loader css={{width: "100%"}} />}
			{uploadSuccess !== null && <UploadDone success={uploadSuccess} />}
		</div>
	</div>);
}
