// PostDetail.jsx (전체 컴포넌트 구조 + styled-components 스타일 포함)
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import styled from 'styled-components';
import { FaPencilAlt, FaTrash, FaArrowUp, FaArrowDown, FaFlag, FaReply, FaPen, FaHome, FaList, FaEye, FaCommentDots } from 'react-icons/fa';
import { postAPI } from '../../api/PostApi';
import { format, parseISO } from 'date-fns';
import CommentSection from './comment/CommentSection';

// #region styled-components
const Container = styled.div`
  max-width: 1200px;
  margin: 30px auto;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
`;

const CategoryName = styled.div`
  font-size: 22px;
  font-weight: bold;
  color: #4d82f3;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 15px;
  line-height: 1.4;
`;

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #888;
  font-size: 14px;
  margin-bottom: 10px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const Actions = styled.div`
  display: flex;
  gap: 15px;
  padding-right: 5px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 3px;
  &:hover {
    color: #4d82f3;
  }

  svg {
    font-size: 14px;
    position: relative;
    top: 1px;
  }
`;

const PostStats = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  gap: 5px;

  svg {
    font-size: 16px;
    position: relative;
    top: 1px;
  }
`;

const AttachmentSection = styled.div`
  padding-bottom: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
  display: flex;
`;

const AttachmentLabel = styled.div`
  font-weight: bold;
  color: ${({ theme }) => theme.colors.dark};
  margin-right: 15px;
  font-size: 13px;
`

const AttachmentList = styled.ul`
  color: #444;
  display: flex;
  font-size: 12px;
`;

const AttachmentItem = styled.li`
  list-style:none;
  margin-left: 20px;

  &:first-child {
    margin-left: 3px;
  }
`;

const AttachmentLink = styled.a`
  color: ${({ theme }) => theme.colors.dark};
  text-decoration: none;
  max-width: 175px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  vertical-align: bottom;

  &:hover {
  color: ${({ theme }) => theme.colors.secondary};
}
`;

const AttachmentSize = styled.span`
  color: ${({ theme }) => theme.colors.dark};
  margin-left: 1px;
  font-size: 11px;
`;

const Content = styled.div`
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 40px;
  min-height: 200px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
  margin-bottom: 30px;
  position: relative;
`;

const VoteButtons = styled.div`
  display: flex;
  align-items: center;
`;

const VoteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${props => props.type === 'up' ? '#6b8bfc' : '#ff4d4d'};
  &:hover {
    color: ${props => props.type === 'up' ? '#4d82f3' : '#e63939'};
  }
`;

const VoteCount = styled.span`
  font-size: 16px;
  font-weight: bold;
  padding: 0 12px;
`;

const ReportButton = styled.button`
  color: #ff4d4d;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  position: absolute;
  right: 0;
  &:hover {
    text-decoration: underline;
  }
`;

const PostActionsBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
`;

const LeftActions = styled.div`
  display: flex;
  gap: 10px;
`;

const RightActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionBtn = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
`;

const WriteBtn = styled(ActionBtn)`
  background-color: #4d82f3;
  color: white;
  border: none;
  &:hover {
    background-color: #3a6ad4;
  }
`;

const GrayBtn = styled(ActionBtn)`
  background-color: #f1f1f1;
  color: #333;
  border: 1px solid #ddd;
  &:hover {
    background-color: #e5e5e5;
  }
`;

// #endregion

// 파일 크기 변환
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

// 날짜 변환
const formatDate = (isoString) => {
  return format(parseISO(isoString), 'yyyy.MM.dd HH:mm');
};

const PostDetail = () => {
  const navigate = useNavigate();

  const { id } = useParams();
  const [post, setPost] = useState(null);
  const userId = localStorage.getItem("userId");
  const isAuthor = post && post.authorId === userId;

  // 게시글 삭제 핸들러
  const handleDelete = async () => {
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;

    try {
      await postAPI.delete(id);
      navigate("/community");
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      alert("삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };


  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        const data = await postAPI.getPostDetail(id);
        setPost(data);
      } catch (error) {
        console.error("게시글 조회 실패:", error);
      }
    };

    fetchPostDetail();
  }, [id]);

  if (!post) return null;
  return (
    <Container>
      <CategoryName>{post.categoryName}</CategoryName>
      <Title>{post.title}</Title>
      <Meta>
        <Info>
          <span>{post.authorNickname}</span>
          <span>{formatDate(post.createdAt)}</span>
          {post.updatedAt && (
            <span style={{ fontStyle: 'italic' }}>
              수정됨: {formatDate(post.updatedAt)}
            </span>
          )}
        </Info>
        <Actions>
          {isAuthor && (
            <>
              <ActionButton><FaPencilAlt /> 수정</ActionButton>
              <ActionButton onClick={handleDelete}><FaTrash /> 삭제</ActionButton>
            </>
          )}
          <PostStats><FaEye />{post.views} </PostStats>
          <PostStats><FaCommentDots /> {post.commentCount}</PostStats>
        </Actions>
      </Meta>

      {post.attachments && post.attachments.length > 0 && (
        <AttachmentSection>
          <AttachmentLabel>첨부파일</AttachmentLabel>
          <AttachmentList>
            {post.attachments.map((file, idx) => (
              <AttachmentItem key={idx}>
                <AttachmentLink href={file.url} download target="_blank" rel="noopener noreferrer" title={file.name}>
                  · {file.name}
                </AttachmentLink>
                <AttachmentSize>({formatFileSize(file.size)})</AttachmentSize>
              </AttachmentItem>
            ))}
          </AttachmentList>
        </AttachmentSection>
      )}

      <Content dangerouslySetInnerHTML={{ __html: post.content }} />

      <Footer>
        <VoteButtons>
          <VoteButton type="up"><FaArrowUp /></VoteButton>
          <VoteCount>{post.voteCount}</VoteCount>
          <VoteButton type="down"><FaArrowDown /></VoteButton>
        </VoteButtons>
        <ReportButton><FaFlag /> 신고</ReportButton>
      </Footer>

      <CommentSection postId={post.id}></CommentSection>

      <PostActionsBar>
        <LeftActions>
          <WriteBtn onClick={() => navigate("/community/board/write")}><FaPen /> 글쓰기</WriteBtn>
        </LeftActions>
        <RightActions>
          <GrayBtn onClick={() => navigate("/community")}><FaHome /> 커뮤니티 메인</GrayBtn>
          <GrayBtn><FaList /> 목록</GrayBtn>
          <GrayBtn><FaArrowUp /> TOP</GrayBtn>
        </RightActions>
      </PostActionsBar>
    </Container>
  );
};

export default PostDetail;
