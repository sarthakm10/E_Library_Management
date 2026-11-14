package com.elibrary.book;

import com.elibrary.common.ApiException;
import com.elibrary.common.Values;
import com.elibrary.config.AppProperties;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
public class UploadController {
    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/gif", "gif");

    private final Path uploadDir;

    public UploadController(AppProperties props) {
        this.uploadDir = Path.of(props.uploadDir()).toAbsolutePath().normalize();
    }

    /** Stores a cover image under a random name and returns its legacy-format link plus a browser URL. */
    @PostMapping("/api/admin/uploads")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) throw ApiException.badRequest("Choose an image to upload");
        String ext = ALLOWED.get(String.valueOf(file.getContentType()).toLowerCase());
        if (ext == null) throw ApiException.badRequest("Only JPG, PNG, WEBP or GIF images are allowed");
        if (!looksLikeImage(file)) throw ApiException.badRequest("That file doesn't look like an image");

        Files.createDirectories(uploadDir);
        String name = "cover-" + UUID.randomUUID().toString().substring(0, 12) + "." + ext;
        Path target = uploadDir.resolve(name).normalize();
        if (!target.startsWith(uploadDir)) throw ApiException.badRequest("Invalid file name");
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        String link = "~/book_inventory/" + name;
        return Map.of("link", link, "url", Values.imageUrl(link));
    }

    /** Checks magic bytes so a renamed non-image can't be stored. */
    private static boolean looksLikeImage(MultipartFile file) throws IOException {
        byte[] head = new byte[12];
        int n;
        try (InputStream in = file.getInputStream()) {
            n = in.readNBytes(head, 0, head.length);
        }
        if (n < 4) return false;
        boolean jpg = (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8;
        boolean png = (head[0] & 0xFF) == 0x89 && head[1] == 'P' && head[2] == 'N' && head[3] == 'G';
        boolean gif = head[0] == 'G' && head[1] == 'I' && head[2] == 'F';
        boolean webp = n >= 12 && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
                && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P';
        return jpg || png || gif || webp;
    }
}
