import React, { useMemo, useState, useEffect } from "react";
import styles from "./HomePage.module.less";
import type { ColumnsType } from "antd/es/table";
import { Input, Button, Flex, Table, Space, Tag, Modal, message } from "antd";
import { ClockCircleOutlined, DeleteColumnOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import * as XLSX from "xlsx";
interface DataEntry {
  materialCode: string;
  materialDescription: string;
  weight: string;
  weightUnit: string;
  enTexture: string;
  boundaryDimension: string;
  specificationName: string;
  groes: string;
}

const TOKEN_STORAGE_KEY = "sanny_token";
const HISTORY_STORAGE_KEY = "sanny_history";

export const HomePage = () => {
  const [history, setHistory] = useState<DataEntry[]>([]);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [token, setToken] = useState("");
  const [ids, setIds] = useState("");

  const handleDeleteToken = () => {
    if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
      message.warning("Không có dữ liệu để xóa");
      return;
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    message.success("Đã xóa token");
  };

  const handleDeleteAll = () => {
    if (!localStorage.getItem(HISTORY_STORAGE_KEY)) {
      message.warning("Không có dữ liệu để xóa");
      return;
    }
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    setHistory([]);
    message.success("Đã xóa hết dữ liệu");
  };

  const handleSaveToken = () => {
    if (!token) {
      message.warning("Chưa nhập token");
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setIsTokenModalOpen(false);
  };

  const handleExportExcel = () => {
    if (!history.length) {
      message.warning("Không có dữ liệu để xuất");
      return;
    }

    // Chuyển data sang dạng JSON thuần
    const exportData = history.map((item) => ({
      Mã: item.materialCode,
      "Cân nặng": item.weight,
      "Đơn vị": item.weightUnit,
      "Vật liệu": item.enTexture,
      "Kích thước": item.boundaryDimension,
      "Thông số kỹ thuật và modal": item.groes,
    }));

    // Tạo worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSach");

    // Xuất file
    XLSX.writeFile(workbook, "Danh_sach_vat_lieu.xlsx");
  };
  const handleSearch = async () => {
    try {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!savedToken) {
        message.warning("Chưa có token");
        return;
      }

      if (!ids.trim()) {
        message.warning("Vui lòng nhập ID");
        return;
      }

      const idList = ids
        .split(" ")
        .map((id) => id.trim())
        .filter(Boolean);

      message.loading({ content: "Đang tìm...", key: "search" });

      // const response = await fetch(
      //   "/api/api-gateway/bom-server/dimpart/getDimRdPartsStyleDf",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: savedToken,
      //       "authorization-userid": "1679596610662825985",
      //     },
      //     body: JSON.stringify({
      //       languageType: "vi",
      //       materialCode: ids,
      //       userId: "1679596610662825985",
      //     }),
      //   },
      // );

      // if (!response.ok) {
      //   throw new Error("API error");
      // }

      // const result = await response.json();

      // const cleanedData: DataEntry[] = [
      //   {
      //     materialCode: result.data.baseInfo.materialCode ?? "",
      //     weight: result.data.mdmInfo.weight ?? "",
      //     weightUnit: result.data.baseInfo.weightUnit ?? "",
      //     enTexture: result.data.mdmInfo.enTexture ?? "",
      //     boundaryDimension: result.data.mdmInfo.boundaryDimension ?? "",
      //   },
      // ];

      // setHistory((prev) => {
      //   // tránh trùng materialCode
      //   const merged = [
      //     ...prev.filter(
      //       (item) => item.materialCode !== cleanedData[0].materialCode,
      //     ),
      //     ...cleanedData,
      //   ];

      //   localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(merged));

      //   return merged;
      // });

      const cleanToken = savedToken.replace(/^Bearer\s+/i, "");
      // Gọi API song song
      const responses = await Promise.all(
        idList.map((materialCode) =>
          fetch("/api/api-gateway/bom-server/dimpart/getDimRdPartsStyleDf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: cleanToken,
              "authorization-userid": "1679596610662825985",
            },
            body: JSON.stringify({
              languageType: "vi",
              materialCode,
              userId: "1679596610662825985",
            }),
          }).then((res) => {
            if (!res.ok) throw new Error("API error");
            return res.json();
          }),
        ),
      );

      // CHECK TOKEN EXPIRE
      const isTokenExpired = responses.some((res) => res?.code === "10001");

      if (isTokenExpired) {
        message.error({
          content: "Token hết hạn, vui lòng đăng nhập lại",
          key: "search",
        });

        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken("");

        return;
      }

      // Lọc bỏ response có data = null
      const validResponses = responses.filter(
        (res) => res?.data !== null && res?.data !== undefined,
      );

      if (!validResponses.length) {
        message.warning({ content: "Không tìm thấy dữ liệu", key: "search" });
        return;
      }

      // Transform dữ liệu
      const cleanedData: DataEntry[] = validResponses.map((result) => {
        const source = result.data ?? {};
        return {
          materialCode: source.baseInfo?.materialCode ?? "",
          materialDescription: source.mdmInfo?.materialDescription ?? "",
          weight: source.mdmInfo?.weight ?? "",
          weightUnit: result.data.baseInfo.weightUnit ?? "",
          enTexture: source.mdmInfo?.enTexture ?? "",
          boundaryDimension: source.mdmInfo?.boundaryDimension ?? "",
          specificationName: source.mdmdmInfo?.specificationName ?? "",
          groes: source.baseInfo?.groes ?? "",
        };
      });

      // Merge + tránh trùng
      setHistory((prev) => {
        const merged = [
          ...prev.filter(
            (item) =>
              !cleanedData.some(
                (newItem) => newItem.materialCode === item.materialCode,
              ),
          ),
          ...cleanedData,
        ];

        localStorage.setItem("sanny_history", JSON.stringify(merged));

        return merged;
      });

      message.success({ content: "Tìm thành công", key: "search" });
    } catch (error) {
      console.error(error);
      message.error({ content: "Gọi API thất bại", key: "search" });
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
      setToken(savedToken);
    }

    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const columns: ColumnsType<DataEntry> = useMemo(
    () => [
      {
        title: "Mã",
        dataIndex: "materialCode",
        key: "materialCode",
        render: (value: string) => <b>{value}</b>,
      },
      {
        title: "Tên",
        dataIndex: "materialDescription",
        key: "materialDescription",
        render: (value: string) => <b>{value}</b>,
      },
      {
        title: "Cân nặng",
        dataIndex: "weight",
        key: "weight",
        render: (value: string) => <span>{value} </span>,
      },
      {
        title: "Đơn vị",
        dataIndex: "weightUnit",
        key: "weightUnit",
        render: (value: string) => <span>{value} </span>,
      },
      {
        title: "Vật liệu",
        dataIndex: "enTexture",
        key: "enTexture",
        render: (value: string) => <span>{value}</span>,
      },
      {
        title: "Kích thước",
        dataIndex: "boundaryDimension",
        key: "boundaryDimension",
        render: (value: string) => <span>{value}</span>,
      },
      {
        title: "Thông số kỹ thuật và model",
        dataIndex: "groes",
        key: "groes",
        render: (value: string) => <span>{value}</span>,
      },
      {
        title: "Hành động",
        fixed: "right",
        render: (_: any, record: DataEntry) => (
          <Button
            size="small"
            icon={<DeleteColumnOutlined />}
            danger
            onClick={() => {
              setHistory((prev) => {
                const updated = prev.filter(
                  (item) => item.materialCode !== record.materialCode,
                );
                localStorage.setItem(
                  HISTORY_STORAGE_KEY,
                  JSON.stringify(updated),
                );
                return updated;
              });
            }}
          >
            Delete
          </Button>
        ),
      },
    ],
    [history],
  );

  return (
    <div className={styles.assemblyFormPage}>
      <div className={styles.mainContainer} style={{ gap: "10px" }}>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <Input
              placeholder="Nhập ID cách nhau 1 khoảng trắng"
              value={ids}
              onChange={(e) => setIds(e.target.value)}
              onPressEnter={handleSearch}
            />
            <div className={styles.buttonGroup}>
              <Button
                style={{ backgroundColor: "#0026ff", color: "white" }}
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>

              <Button
                style={{ backgroundColor: "#0026ff", color: "white" }}
                onClick={handleExportExcel}
              >
                Xuất Excel
              </Button>

              <Button
                style={{ backgroundColor: "#0026ff", color: "white" }}
                onClick={() => setIsTokenModalOpen(true)}
              >
                QL Token
              </Button>

              <Button
                style={{ backgroundColor: "#0026ff", color: "white" }}
                onClick={handleDeleteAll}
              >
                Xóa tất cả
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.assemblyTableWrapper}>
          <Table
            rowKey="materialCode"
            dataSource={history}
            columns={columns}
            pagination={false}
            scroll={{ x: "max-content", y: "100vh" }}
            style={{
              border: "1px solid #f0f0f0",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          />
        </div>
      </div>

      {/* ✅ Modal nhập Token */}
      <Modal
        title="Quản lý Token"
        open={isTokenModalOpen}
        onCancel={() => setIsTokenModalOpen(false)}
        footer={[
          <Button key="delete" danger onClick={handleDeleteToken}>
            Xóa token
          </Button>,
          <Button key="cancel" onClick={() => setIsTokenModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveToken}>
            Lưu
          </Button>,
        ]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Nhập token của bạn..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        {token && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#52c41a" }}>
            Token hiện tại đã được lưu
          </div>
        )}
      </Modal>
    </div>
  );
};
