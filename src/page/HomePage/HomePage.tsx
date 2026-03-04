import React, { useMemo, useState, useEffect } from "react";
import styles from "./HomePage.module.less";
import type { ColumnsType } from "antd/es/table";
import { Input, Button, Flex, Table, Space, Tag, Modal, message } from "antd";
import { ClockCircleOutlined, DeleteColumnOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [history, setHistory] = useState<DataEntry[]>([]);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [token, setToken] = useState("");
  const [ids, setIds] = useState("");
  const containsChinese = (text: string) => /[\u3400-\u9FBF]/.test(text);
  const textureMap: Record<string, string> = {
    钢质: "Steel",
  };
  const textureCache = new Map<string, string>();
  const translateToVi = async (text: string) => {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        to: "vi",
      }),
    });

    const data = await res.json();
    return data.translatedText;
  };

  const translateToViByGoogleTranslate = async (text: string) => {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh&tl=vi&dt=t&q=${encodeURIComponent(text)}`,
    );

    const data = await res.json();
    return data[0][0][0];
  };

  const translateToEnByGoogleTranslate = async (text: string) => {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh&tl=en&dt=t&q=${encodeURIComponent(text)}`,
    );

    const data = await res.json();
    return data[0][0][0];
  };
  const getTranslatedTexture = async (raw: string) => {
    const texture = raw.trim();

    if (!texture) return "";

    // 1️⃣ Có trong map
    if (textureMap[texture]) {
      return textureMap[texture];
    }

    // 2️⃣ Có trong cache
    if (textureCache.has(texture)) {
      return textureCache.get(texture)!;
    }

    // 3️⃣ Gọi API dịch
    try {
      const translated = await translateToEnByGoogleTranslate(texture);
      textureCache.set(texture, translated);
      return translated;
    } catch {
      return texture; // fallback nếu lỗi
    }
  };

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
    if (!token || token == "") {
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
      Tên: item.materialDescription,
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
      // const cleanedData: DataEntry[] = validResponses.map((result) => {
      //   const source = result.data ?? {};
      //   return {
      //     materialCode: source.baseInfo?.materialCode ?? "",
      //     materialDescription: source.mdmInfo?.materialDescription ?? "",
      //     weight: source.mdmInfo?.weight ?? "",
      //     weightUnit: result.data.baseInfo.weightUnit ?? "",
      //     enTexture: source.mdmInfo?.enTexture ?? "",
      //     boundaryDimension: source.mdmInfo?.boundaryDimension ?? "",
      //     specificationName: source.mdmdmInfo?.specificationName ?? "",
      //     groes: source.baseInfo?.groes ?? "",
      //   };
      // });

      // const cleanedData: DataEntry[] = await Promise.all(
      //   validResponses.map(async (result) => {
      //     const source = result.data ?? {};

      //     let texture = source.mdmInfo?.enTexture ?? "";

      //     // 🔥 chỉ dịch nếu là tiếng Trung
      //     if (texture && containsChinese(texture)) {
      //       texture = await translateToEnByGoogleTranslate(texture);
      //     }

      //     return {
      //       materialCode: source.baseInfo?.materialCode ?? "",
      //       materialDescription: source.mdmInfo?.materialDescription ?? "",
      //       weight: source.mdmInfo?.weight ?? "",
      //       weightUnit: source.baseInfo?.weightUnit ?? "",
      //       enTexture: texture,
      //       boundaryDimension: source.mdmInfo?.boundaryDimension ?? "",
      //       specificationName: source.mdmInfo?.specificationName ?? "",
      //       groes: source.baseInfo?.groes ?? "",
      //     };
      //   }),
      // );

      const cleanedData: DataEntry[] = await Promise.all(
        validResponses.map(async (result) => {
          const source = result.data ?? {};

          let texture = (source.mdmInfo?.texture ?? "").trim();

          if (texture && containsChinese(texture)) {
            // 🔥 Nếu có trong map thì dùng luôn
            if (textureMap[texture]) {
              texture = textureMap[texture];
            }
            // 🔁 Nếu có trong cache
            else if (textureCache.has(texture)) {
              texture = textureCache.get(texture)!;
            }
            // 🌍 Nếu chưa có thì gọi API dịch
            else {
              try {
                const translated =
                  await translateToEnByGoogleTranslate(texture);
                textureCache.set(texture, translated);
                texture = translated;
              } catch {
                // nếu lỗi thì giữ nguyên
              }
            }
          }

          return {
            materialCode: source.baseInfo?.materialCode ?? "",
            materialDescription: source.mdmInfo?.materialDescription ?? "",
            weight: source.mdmInfo?.weight ?? "",
            weightUnit: source.baseInfo?.weightUnit ?? "",
            enTexture: texture,
            boundaryDimension: source.mdmInfo?.boundaryDimension ?? "",
            specificationName: source.mdmInfo?.specificationName ?? "",
            groes: source.baseInfo?.groes ?? "",
          };
        }),
      );

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
        title: t("table.field.materialCode"),
        dataIndex: "materialCode",
        key: "materialCode",
        render: (value: string) => <b>{value}</b>,
      },
      {
        title: t("table.field.name"),
        dataIndex: "materialDescription",
        key: "materialDescription",
        render: (value: string) => <b>{value}</b>,
      },
      {
        title: t("table.field.weight"),
        dataIndex: "weight",
        key: "weight",
        render: (value: string) => <span>{value} </span>,
      },
      {
        title: t("table.field.weightUnit"),
        dataIndex: "weightUnit",
        key: "weightUnit",
        render: (value: string) => <span>{value} </span>,
      },
      {
        title: t("table.field.texture"),
        dataIndex: "enTexture",
        key: "enTexture",
        render: (value: string) => <span>{value}</span>,
      },
      {
        title: t("table.field.boundaryDimension"),
        dataIndex: "boundaryDimension",
        key: "boundaryDimension",
        render: (value: string) => <span>{value}</span>,
      },
      {
        title: t("table.field.groes"),
        dataIndex: "groes",
        key: "groes",
        render: (value: string) => <span>{value}</span>,
      },
      {
        title: t("action.label"),
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
            {t("action.delete")}
          </Button>
        ),
      },
    ],
    [history, t],
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
                {t("action.search")}
              </Button>

              <Button
                style={{ backgroundColor: "#0026ff", color: "white" }}
                onClick={handleExportExcel}
              >
                {t("action.export")}
              </Button>

              <Button
                style={{ backgroundColor: "#0026ff", color: "white" }}
                onClick={() => setIsTokenModalOpen(true)}
              >
                {t("action.mngToken")}
              </Button>

              <Button
                style={{ backgroundColor: "#0026ff", color: "white" }}
                onClick={handleDeleteAll}
              >
                {t("action.delete")}
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
            {t("action.delete")} {t("entity.token")}
          </Button>,
          <Button key="cancel" onClick={() => setIsTokenModalOpen(false)}>
            {t("action.cancel")}
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveToken}>
            {t("action.save")}
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
            {t("message.tokenSaved")}
          </div>
        )}
      </Modal>
    </div>
  );
};
