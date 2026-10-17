import { GuruFrame, GuruSection } from '@/component/GuruFrame';
import { ErrorLabel } from '@/ui/Label';

export default () => (<GuruFrame severity="warning">
	<GuruSection as="h1">GURU MEDITATION</GuruSection>
	<ErrorLabel error="Page not found" />
</GuruFrame>);
