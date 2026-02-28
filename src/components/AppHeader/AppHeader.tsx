import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  Typography,
  Dropdown,
  Avatar,
  Menu,
  Divider,
  Space,
  Select,
  message,
} from "antd";
import {
  MessageOutlined,
  LogoutOutlined,
  UserOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useMediaQuery } from "@mui/material";
import styles from "./AppHeader.module.less";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../LanguageSwitcher";
import reactLogo from "@/assets/react.svg";
export const AppHeader: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("only screen and (max-width: 769px)");
  const userEmail = "Unknown user";
  const userName = "Guest";

  const handleMenuClick = (key: string) => {
    if (key === "logout") {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  // Nội dung của menu khi click vào Avatar
  const userMenu = (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow:
          "0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08)",
        padding: "16px",
        minWidth: "220px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
          {userEmail}
        </Typography.Text>
        <div style={{ margin: "12px 0" }}>
          <Avatar
            size={64}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#f5f5f5", color: "#ccc" }}
          />
        </div>
        <Typography.Text strong style={{ fontSize: "16px", display: "block" }}>
          {t("layout.header.user.hi")}, {userName}!
        </Typography.Text>
      </div>

      <Divider style={{ margin: "12px 0" }} />

      <div
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        onClick={() => handleMenuClick("logout")}
      >
        <LogoutOutlined />
        <span>{t("layout.header.user.logout")}</span>
      </div>
    </div>
  );

  return (
    <div className={styles.header}>
      {/* Left */}
      <div className={styles.left}>
        <img
          src={reactLogo}
          className={styles.logo}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />
        <Typography.Title level={4} className={styles.title}>
          ADMIN
        </Typography.Title>
      </div>

      {/* Right */}
      <div
        className={styles.right}
        style={{ display: "flex", alignItems: "center" }}
      >
        <LanguageSwitcher className={styles.transparentSelect} />
        <Dropdown
          menu={{
            items: [
              {
                key: "filter",
                label: userMenu,
              },
            ],
          }}
          trigger={["click"]}
          placement="bottomRight"
        >
          {isMobile ? (
            <Avatar
              style={{
                width: "36px",
                height: "36px",
                backgroundColor: "#AB47BC",
              }}
              icon={<UserOutlined />}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: 4,
                height: "2.5rem",
                width: "2.5rem",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <Avatar
                style={{ backgroundColor: "#AB47BC" }}
                icon={<UserOutlined />}
              />
            </div>
          )}
        </Dropdown>
      </div>
    </div>
  );
};
