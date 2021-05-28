import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';
import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: any;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadPost(): Promise<void> {
    try {
      let results = await fetch(postsPagination.next_page).then(response =>
        response.json()
      );

      setNextPage(results.next_page);
      results = results.results;
      const newPosts = results.map(post => ({
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      }));

      setPosts([...posts, ...newPosts]);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Header />
      <main className={styles.container}>
        <div className={styles.content}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>
                    <FiCalendar className={styles.icon} />{' '}
                    {format(
                      new Date(post.first_publication_date),
                      'dd LLL yyyy',
                      { locale: ptBR }
                    )}
                  </time>
                  <p>
                    <FiUser className={styles.icon} /> {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage !== null && (
          <div className={styles.containerButton}>
            <button type="button" onClick={handleLoadPost}>
              Carregar mais posts
            </button>
          </div>
        )}
      </main>
      {preview && (
        <aside className={styles.containerPreview}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'publication')],
    {
      fetch: ['post.title', 'post.content', 'post.author'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    results,
    next_page: postsResponse.next_page,
  };

  return {
    props: {
      postsPagination,
      preview,
    },
  };
};
