import { useState } from 'react';
import Header from '../components/Header';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi'

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
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results)
  const [nextPage, setNextPage] = useState(postsPagination.next_page)

  async function handleLoadPost() {
    try {
      let results = await fetch(postsPagination.next_page).then(results => results.json())
      setNextPage(results.next_page)
      results = results.results
      let newPosts = results.map(post => ({
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
      }))

      setPosts([...posts, ...newPosts])
    } catch (err) {
      console.error(err)
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
                  <time><FiCalendar className={styles.icon} /> {format(new Date(post.first_publication_date), "dd LLL yyyy", { locale: ptBR })}</time>
                  <p><FiUser className={styles.icon} /> {post.data.author}</p>
                </div>
              </a>
            </Link>
          ))
          }

        </div>
        {
          nextPage !== null &&
          <div className={styles.containerButton}>
            <button onClick={handleLoadPost}>Carregar mais posts</button>
          </div>
        }
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'publication')
  ], {
    fetch: ['post.title', 'post.content', 'post.author'],
    pageSize: 1
  });

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  let postsPagination = {
    results,
    next_page: postsResponse.next_page
  }

  return {
    props: {
      postsPagination
    }
  }
};
