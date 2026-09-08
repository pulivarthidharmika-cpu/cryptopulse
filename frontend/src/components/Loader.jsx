function Loader({ text = "Loading..." }) {
  return (
    <div style={styles.container}>

      <div style={styles.spinner}></div>

      <span>
        {text}
      </span>

      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

    </div>
  );
}

const styles = {
  container: {
    minHeight: "250px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
    color: "#2563eb",
    fontSize: "15px",
    fontWeight: "600",
  },

  spinner: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    border:
      "4px solid #dbeafe",
    borderTop:
      "4px solid #2563eb",
    animation:
      "spin .8s linear infinite",
  },
};

export default Loader;