import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        minLength: 3,
    },
    description: {
        type: String,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        require: true,
    },
    
    status: {
        type: String,
        required: true,
    },
}, { timestamps: true, versionKey: false });

productSchema.plugin(mongoosePaginate);
export default mongoose.model('Product', productSchema);
