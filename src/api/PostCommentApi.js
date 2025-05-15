import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_COMMUNITY_POST_API_URL || 'http://localhost/api/community/posts',
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const postCommentAPI = {
    // 최상위 댓글 조회
    // getTopLevelComments: async (postId, offset = 0, limit = 20) => {
    //     const response = await api.get(`/${postId}/comments`, {
    //         params: { offset, limit }
    //     });
    //     return response.data.data;
    // },

    // 댓글 조회
    getCommentsWithReplies: async(postId, offset, limit) => {
        const userId = localStorage.getItem("userId");
        const response = await api.get(`/${postId}/comments`, {
            params: { userId, offset, limit }
        });
        return response.data.data;
    },

    // 댓글 등록
    create: async (postId, commentData) => {
        const response = await api.post(`/${postId}/comments`, commentData);
        return response.data.data;
    },

    // 댓글 삭제
    delete: async (postId, commentId) => {
        const response = await api.delete(`/${postId}/comments/${commentId}`);
        return response.data.data;
    },

    // 댓글 수정
    update: async (postId, commentId, dto) => {
        const response = await api.put(`/${postId}/comments/${commentId}`, dto);
        return response.data.data;
    }

};