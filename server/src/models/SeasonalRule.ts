import mongoose, { Document, Schema } from 'mongoose';


export interface ISeasonalRule extends Document {
  name: string;
  tags: string[];
  categories: mongoose.Types.ObjectId[];
  months: number[];
  demandMultiplier: number;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const seasonalRuleSchema = new Schema<ISeasonalRule>({
  name: { type: String, required: true },
  tags: { type: [String], default: [] },
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category', default: [] }],
  months: { type: [Number], required: true },
  demandMultiplier: { type: Number, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const SeasonalRule = mongoose.models.SeasonalRule || mongoose.model<ISeasonalRule>('SeasonalRule', seasonalRuleSchema);
export default SeasonalRule;
