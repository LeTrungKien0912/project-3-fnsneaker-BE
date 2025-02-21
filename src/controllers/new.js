import New from "../models/New.js";

// Create a new article
export const createNew = async (req, res) => {
  try {
    const { img, title, desc, detailNew } = req.body;

    // Gán ID người dùng cho account trong detailNew và fullName cho author
    detailNew.account = req.user._id;
    const author = req.user.fullName; // Lấy fullName từ user đăng nhập

    const newArticle = new New({
      img,
      title,
      desc,
      detailNew,
      author, // Thêm author vào bài viết
    });

    await newArticle.save();

    const formattedArticle = await New.findById(newArticle._id).lean();

    formattedArticle.detailNew = formattedArticle.detailNew.map((detail) => {
      const { _id, ...rest } = detail;
      return rest;
    });

    return res.status(201).json({
      message: "New article created successfully",
      data: formattedArticle,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// Fetch all articles
export const getAllNews = async (req, res) => {
  try {
    const news = await New.find().lean(); // Sử dụng lean()

    // Loại bỏ _id trong detailNew của tất cả các bài viết
    const formattedNews = news.map((article) => {
      article.detailNew = article.detailNew.map((detail) => {
        const { _id, ...rest } = detail;
        return rest;
      });
      return article;
    });

    return res.status(200).json({
      message: "News fetched successfully",
      data: formattedNews,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// Fetch a single article by ID
export const getNewById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await New.findById(id).lean(); // Sử dụng lean()

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    // Loại bỏ _id trong detailNew
    article.detailNew = article.detailNew.map((detail) => {
      const { _id, ...rest } = detail;
      return rest;
    });

    return res.status(200).json({
      message: "Article fetched successfully",
      data: article,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// Update an article
export const updateNew = async (req, res) => {
  try {
    const { id } = req.params;
    const { img, title, desc, detailNew } = req.body;

    // Tìm bài viết hiện tại để lấy thông tin author
    const existingArticle = await New.findById(id);

    if (!existingArticle) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    // Cập nhật bài viết nhưng giữ nguyên author cũ
    const updatedArticle = await New.findByIdAndUpdate(
      id,
      {
        img,
        title,
        desc,
        detailNew,
        author: existingArticle.author, // Giữ nguyên author
      },
      { new: true, lean: true }
    );

    updatedArticle.detailNew = updatedArticle.detailNew.map((detail) => {
      const { _id, ...rest } = detail;
      return rest;
    });

    return res.status(200).json({
      message: "Article updated successfully",
      data: updatedArticle,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};



// Delete an article
export const deleteNew = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedArticle = await New.findByIdAndDelete(id);

    if (!deletedArticle) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    return res.status(200).json({
      message: "Article deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

