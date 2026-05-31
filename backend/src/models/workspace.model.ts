import { InferSchemaType, model, Schema } from 'mongoose';

const workspaceSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minLength: 3,
			maxLength: 100,
		},
		ownerId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		workspaceType: {
			type: String,
			enum: ['personal', 'team'],
			default: 'personal',
		},
	},
	{
		timestamps: true,
	},
);

// Ensure a user can only have one personal workspace or same user cannot create multiple personal workspaces

workspaceSchema.index(
	{ ownerId: 1, workspaceType: 1 },
	{
		unique: true,
		partialFilterExpression: { workspaceType: 'personal' },
	},
);

export type Workspace = InferSchemaType<typeof workspaceSchema>;

export const WorkspaceModel = model<Workspace>('Workspace', workspaceSchema, 'workspaces');
