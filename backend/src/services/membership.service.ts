import { MembershipModel } from '../models/membership.model';
import { AppError } from '../utils/global-error-handler';

// For now this is okay because each user only has one workspace, but in the future we'll support selected workspace from frontend.

export const getDefaultWorkspaceForUser = async (userId: string) => {
	const membership = await MembershipModel.findOne({ userId, status: 'active', role: 'owner' }).populate('workspaceId');
	if (!membership) {
		throw new AppError('No active workspace found for user', 404);
	}
	return membership.workspaceId;
};
