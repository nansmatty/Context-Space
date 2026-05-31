import { InferSchemaType, model, Schema } from 'mongoose';

const membershipSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		workspaceId: {
			type: Schema.Types.ObjectId,
			ref: 'Workspace',
			required: true,
		},
		role: {
			type: String,
			enum: ['owner', 'admin', 'member'],
			default: 'member',
		},
		status: {
			type: String,
			enum: ['active', 'suspended', 'invited'],
			default: 'active',
		},
	},
	{
		timestamps: true,
	},
);

// Ensure a user can only have one membership per workspace or same user cannot join same workspace twice

membershipSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export type Membership = InferSchemaType<typeof membershipSchema>;

export const MembershipModel = model<Membership>('Membership', membershipSchema, 'memberships');
