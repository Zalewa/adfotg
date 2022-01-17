import styled from '@emotion/styled';
import { GuruFrame, GuruSection, Severity } from '../component/GuruFrame';

import { Link } from '../ui/Link';
import * as skin from '../skin';

interface GuruMeditationProps {
	severity: Severity,
	error: Error,
}

/** A full-screen error page. */
export const GuruMeditation = (props: GuruMeditationProps ) => {
	const GuruCenter = styled.div({
		maxWidth: "800px",
		margin: "0 auto",
	});
	return (<div css={[skin.fullpage, {
		backgroundColor: "#000",
		overflow: "auto",
	}]}>
		<GuruCenter>
			<GuruFrame severity={props.severity}>
				<GuruSection as="h1">GURU MEDITATION</GuruSection>
				<GuruSection>ADF OTG has failed.</GuruSection>
				<GuruSection css={{marginLeft: "32px"}}>{props.error.toString()}</GuruSection>
				<GuruSection>
					If you think this was caused by a bug, please
					write down steps to reproduce it and report it
					at<br/><Link href="https://github.com/Zalewa/adfotg">https://github.com/Zalewa/adfotg</Link>
				</GuruSection>
				<GuruSection>Browser's console may contain more detailed information.</GuruSection>

			</GuruFrame>
		</GuruCenter>
	</div>);
}
