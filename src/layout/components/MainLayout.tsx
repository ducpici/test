import React from "react";
import { Layout } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import styles from "./MainLayout.module.less";
import { AppHeader } from "@/components/AppHeader";

const { Content } = Layout;

export const MainLayout: React.FC = () => {
  return (
    <Layout className={styles.pageLayout}>
      <AppHeader />
      <Content className={styles.mainContainer}>
        <Outlet />
      </Content>
    </Layout>
  );
};
